import chess
import chess.pgn
import httpx
import json
from redis_client import get_redis
from ai_engine import compute_best_move
from database import async_session
from models import Game, TournamentMatch
from server import manager
from chat.manager import global_chat_manager
from chat.schemas import ActiveGameChangedServerEvent

from tournament_progression_service import advance_tournament


async def handle_game_over(board: chess.Board, game_id: str, websocket, is_surrender: bool = False, surrender_loser_id: int = None):
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

        # Keep the existing tournament progression behavior unchanged
        if not is_surrender and game.tournament_id is not None:
            print(f"[TOURNAMENT] Advancing tournament {game.tournament_id}...")
            await advance_tournament(
                game_id=game.id,
                winner_id=winner_id,
                session=session
            )

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

    # Notify players
    await manager.broadcast_to_game(game_id, {
        "type": "game_over",
        "winner_id": winner_id,
        "loser_id": loser_id,
        "result": result,
        "pgn": game_pgn
    })

    # Clean Redis
    await redis.delete(f"game:{game_id}:fen")
    await redis.delete(f"game:{game_id}:moves")

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

    try:
        move = chess.Move.from_uci(data["move"])
    except ValueError:
        await websocket.send_json({"type": "error", "message": "Invalid move format!"})
        return

    human_san = board.san(move)

    if move in board.legal_moves:
        board.push(move)
        await redis.set(redis_key, board.fen())
        await redis.rpush(f"game:{game_id}:moves", move.uci())

        await manager.broadcast_to_game(game_id, {
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
        await websocket.send_json({"type": "error", "message": "Illegal move"})

