import chess
import chess.pgn
import httpx
import json
import time
from redis_client import get_redis
from ai_engine import compute_best_move
from database import async_session
from models import Game, TournamentMatch
from server import manager
from chat.manager import global_chat_manager
from chat.schemas import (
    ActiveGameChangedServerEvent,
    GameReconnectResultServerEvent,
)

from tournament_progression_service import advance_tournament


async def handle_game_over(
    board: chess.Board,
    game_id: str,
    websocket,
    is_surrender: bool = False,
    surrender_loser_id: int = None,
    is_timeout: bool = False,
    timeout_loser_id: int = None,
    is_disconnect_timeout: bool = False,
    is_agreed_draw: bool = False
):
    """Generates the game history, cleans RAM, updates ELO, and advances tournaments."""
    
    redis = await get_redis()
    moves_list = await redis.lrange(f"game:{game_id}:moves", 0, -1)

    # Replay the game to generate PGN
    replay_board = chess.Board()
    for move_uci in moves_list:
        replay_board.push(chess.Move.from_uci(move_uci))
    game_pgn = str(chess.pgn.Game.from_board(replay_board))

    # DETERMINE THE WINNER USING PYTHON-CHESS RULES
    result = board.result() # Returns '1-0' (White), '0-1' (Black), or '1/2-1/2' (Draw)
    winner_id = None
    loser_id = None

    affected_user_ids: set[int] = set()

     # SAVE TO POSTGRESQL AND GRAB THE TRUE IDs
    async with async_session() as session:
        game = await session.get(Game, int(game_id))
        if not game:
            return

        if game.status == "completed":
            print(f"[SHIELD] Game {game_id} is already over. Ignoring duplicate request.")
            return

        # Refresh active game state for every human player affected by this result
        affected_user_ids = {
            player_id
            for player_id in (
                game.white_player_id,
                game.black_player_id,
            )
            if player_id is not None
        }

        # Surrender overrides python-chess
        if is_surrender:
            loser_id = surrender_loser_id
            winner_id = game.white_player_id if loser_id == game.black_player_id else game.black_player_id
            result = "Surrender"
        elif is_timeout:
            loser_id = timeout_loser_id
            winner_id = game.white_player_id if loser_id == game.black_player_id else game.black_player_id
            result = "Timeout"
        elif is_agreed_draw:
            winner_id = None
            loser_id = None
            result = "1/2-1/2"
            game.is_draw = True
        else:
            # Normal chess result
            if result == "1-0":
                winner_id = game.white_player_id
                loser_id = game.black_player_id
            elif result == "0-1":
                winner_id = game.black_player_id
                loser_id = game.white_player_id
            elif result == "1/2-1/2":
                winner_id = None
                loser_id = None
                game.is_draw = True

        # Persist the final game state for both normal endings and surrender
        game.moves_pgn = game_pgn
        game.winner_id = winner_id
        game.status = "completed"
        session.add(game)
        await session.commit()
        print(f"[DB] Game {game_id} saved. Winner: {winner_id}")

        # TOURNAMENT PROGRESSION TRIGGER
        if game.tournament_id is not None:
            print(f"[TOURNAMENT] Advancing tournament {game.tournament_id}...")
            await advance_tournament(
                game_id=game.id,
                winner_id=winner_id,
                session=session
            )

    # Notify authenticated application sockets after the completed state is committed
    await global_chat_manager.send_to_users(
        affected_user_ids,
        ActiveGameChangedServerEvent(),
    )

    # Report disconnect timeout only after the completed game state is committed
    if (
        is_timeout
        and is_disconnect_timeout
        and winner_id is not None
        and loser_id is not None
    ):
        await global_chat_manager.send_to_users(
            affected_user_ids,
            GameReconnectResultServerEvent(
                game_id=int(game_id),
                winner_id=winner_id,
                loser_id=loser_id,
            ),
        )

    # Notify players
    await manager.broadcast_to_game(int(game_id), {
        "type": "game_over",
        "winner_id": winner_id,
        "loser_id": loser_id,
        "result": result,
        "pgn": game_pgn
    })

    # Clean Redis
    await redis.delete(f"game:{game_id}:fen")
    await redis.delete(f"game:{game_id}:moves")
    await redis.delete(f"game:{game_id}:time")

    # Update ELO in Django
    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                "http://django_backend:8000/api/update-elo/",
                json={"winner_id": winner_id, "loser_id": loser_id},
                headers={"Host": "localhost"}
            )
            print(f"[GAME OVER] ELO updated for Game {game_id}")
        except Exception as e:
            print(f"[ERROR] Failed to reach Django: {e}")




async def handle_player_move(data: dict, game_id: str, websocket):
    redis = await get_redis()
    redis_key = f"game:{game_id}:fen"

    current_fen = await redis.get(redis_key)
    board = chess.Board(current_fen) if current_fen else chess.Board()

    if len(board.move_stack) == 0 and data.get("is_vs_bot") != True:
    # Check how many WebSockets are in this Game Room
        room_connections = manager.rooms.get(int(game_id), [])
        if len(room_connections) < 2:
            await websocket.send_json({"type": "error", "message": "Waiting for opponent to connect...", "fen": board.fen()})
            return

    try:
        move = chess.Move.from_uci(data["move"])
    except ValueError:
        await websocket.send_json({"type": "error", "message": "Invalid move format!", "fen": board.fen()})
        return

    human_san = board.san(move)

    if move in board.legal_moves:
        await update_clock(game_id, is_white_turn=board.turn == chess.WHITE)
        board.push(move)
        await redis.set(redis_key, board.fen())
        await redis.rpush(f"game:{game_id}:moves", move.uci())

        await manager.broadcast_to_game(int(game_id), {
            "type": "move",
            "move": move.uci(),
            "san_move": human_san,
            "fen": board.fen()
        })

        if board.is_game_over():
            await handle_game_over(board, game_id, websocket=websocket)
            return

        if data.get("is_vs_bot") == True:
            print(f"Triggering AI for Game {game_id}...") 
            await websocket.send_json({"type": "info", "message": "Bot is thinking..."})
            safe_depth = 4
            ai_uci = compute_best_move(board.fen(), depth=safe_depth)

            if ai_uci:
                ai_move = chess.Move.from_uci(ai_uci)
                bot_san = board.san(ai_move)
                board.push(ai_move)
                await redis.set(redis_key, board.fen())
                await redis.rpush(f"game:{game_id}:moves", ai_uci)

                await manager.broadcast_to_game(game_id, {
                    "type": "move",
                    "move": ai_uci,
                    "san_move": bot_san,
                    "fen": board.fen()
                })

                if board.is_game_over():
                    await handle_game_over(board, game_id, websocket=websocket)
                    return

    else:
        await websocket.send_json({"type": "error", "message": "Illegal move", "fen": board.fen()})


async def update_clock(game_id: str, is_white_turn: bool):
    redis = await get_redis()
    time_key = f"game:{game_id}:time"
    time_data_str = await redis.get(time_key)
    
    if not time_data_str:
        return # Game is over, ignore

    time_data = json.loads(time_data_str)
    current_time = int(time.time())
    time_spent = current_time - time_data["last_move_at"]
    
    if is_white_turn:
        time_data["white_time"] -= time_spent
    else:
        time_data["black_time"] -= time_spent
        
    time_data["last_move_at"] = current_time
    await redis.set(time_key, json.dumps(time_data))


async def handle_timeout_claim(data: dict, game_id: str, websocket):
    """The Arbiter: Checks if a player actually ran out of time."""
    redis = await get_redis()
    time_key = f"game:{game_id}:time"
    time_data_str = await redis.get(time_key)
    
    if not time_data_str:
        return
        
    time_data = json.loads(time_data_str)
    
    # Check board to see whose turn it currently is
    current_fen = await redis.get(f"game:{game_id}:fen")
    board = chess.Board(current_fen) if current_fen else chess.Board()
    
    active_color = "white" if board.turn == chess.WHITE else "black"
    
    # Do the math: Time left minus time since last move
    seconds_passed = int(time.time()) - time_data["last_move_at"]
    time_left = time_data[f"{active_color}_time"] - seconds_passed
    
    # 3-second grace period for network lag
    if time_left <= 3:
        # THE ARBITER DECIDES THE WINNER (Ignore React's payload)
        async with async_session() as session:
            game = await session.get(Game, int(game_id))
            if not game: return
            
            true_loser = game.white_player_id if active_color == "white" else game.black_player_id
        
        # Call handle_game_over with Timeout flags
        await handle_game_over(
            board, game_id, websocket=websocket, 
            is_timeout=True, timeout_loser_id=true_loser
        )
    else:
        # React lied, or network lag caused a false alarm. Reject the claim
        await websocket.send_json({"type": "error", "message": f"Opponent still has time! Server says they have {time_left} seconds left."})
