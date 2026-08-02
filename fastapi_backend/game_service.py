import chess
import chess.pgn
import httpx
import json
from redis_client import get_redis
from ai_engine import compute_best_move
from database import async_session
from models import Game
from server import manager

async def handle_game_over(board: chess.Board, game_id: str, websocket, is_surrender: bool = False, surrender_loser_id: int = None):
    """Generates the game history, cleans RAM, and updates ELO in Django."""
    
    redis = await get_redis()
    moves_list = await redis.lrange(f"game:{game_id}:moves", 0, -1)
    
    # Replay the game on a fresh board to generate the history
    replay_board = chess.Board()
    for move_uci in moves_list:
        replay_board.push(chess.Move.from_uci(move_uci))
    game_pgn = chess.pgn.Game.from_board(replay_board)
    pgn_string = str(game_pgn)

    # DETERMINE THE WINNER USING PYTHON-CHESS RULES
    result = board.result() # Returns '1-0' (White), '0-1' (Black), or '1/2-1/2' (Draw)
    
    winner_id = None
    loser_id = None

    # SAVE TO POSTGRESQL AND GRAB THE TRUE IDs
    async with async_session() as session:
        game = await session.get(Game, int(game_id))
        if game:
            if is_surrender:
                # If someone surrendered, override the python-chess referee
                loser_id = surrender_loser_id
                # The winner is whoever DIDN'T surrender
                winner_id = game.white_player_id if loser_id == game.black_player_id else game.black_player_id
                result = "Surrender"
            else:
                # Match the python-chess result to the database IDs!
                if result == '1-0':
                    winner_id = game.white_player_id
                    loser_id = game.black_player_id
                elif result == '0-1':
                    winner_id = game.black_player_id
                    loser_id = game.white_player_id

                game.moves_pgn = pgn_string
                game.winner_id = winner_id
                game.status = "completed"
                session.add(game)
                await session.commit()
                print(f"[DB] Game {game_id} permanently saved. Winner: {winner_id}")


    # await websocket.send_json({
    #     "type": "game_over",
    #     "winner_id": winner_id,
    #     "loser_id": loser_id,
    #     "result": result, 
    #     "pgn": pgn_string
    # })
    await manager.broadcast_to_game(game_id, {
        "type": "game_over",
        "winner_id": winner_id,
        "loser_id": loser_id,
        "result": result, 
        "pgn": pgn_string
    })

    await redis.delete(f"game:{game_id}:fen")
    await redis.delete(f"game:{game_id}:moves")

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
        
        
        # await websocket.send_json({
        #     "type": "move",
        #     "move": move.uci(),
        #     "san_move": human_san,
        #     "fen": board.fen()
        # })
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
                # await websocket.send_json({
                #     "type": "move",
                #     "move": ai_uci,
                #     "san_move": bot_san,
                #     "fen": board.fen()
                # })
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