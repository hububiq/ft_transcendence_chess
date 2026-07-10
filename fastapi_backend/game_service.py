import chess
import chess.pgn
import httpx
import json
from redis_client import get_redis
from ai_engine import compute_best_move

async def handle_game_over(board: chess.Board, game_id: str, winner_id: int, loser_id: int, websocket):
    """Generates the game history, cleans RAM, and updates ELO in Django."""
    
    game_pgn = chess.pgn.Game.from_board(board)
    pgn_string = str(game_pgn)

    await websocket.send_json({
        "type": "game_over",
        "winner_id": winner_id,
        "pgn": pgn_string
    })

    # SAVE TO FASTAPI DATABASE
    from sqlmodel import Session
    from database import engine
    from models import Game

    with Session(engine) as session:
        game = session.get(Game, int(game_id))
        if game:
            game.moves_pgn = pgn_string
            game.winner_id = winner_id
            game.status = "completed"
            session.add(game)
            session.commit()
            print(f"[DB] Game {game_id} permanently saved to PostgreSQL")

    redis = await get_redis()
    await redis.delete(f"game:{game_id}:fen")

    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                "http://django_backend:8000/api/update-elo/",
                json={"winner_id": winner_id, "loser_id": loser_id}
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

    if move in board.legal_moves:
        board.push(move)
        await redis.set(redis_key, board.fen())
        await websocket.send_json({"type": "move", "move": move.uci(), "fen": board.fen()})
        
        if board.is_game_over():
            await handle_game_over(board, game_id, winner_id=data["player_id"], loser_id=data["opponent_id"], websocket=websocket)
            return

        if data.get("is_vs_bot") == True:
            print(f"Triggering AI for Game {game_id}...") 
            
            safe_depth = 4
            ai_uci = compute_best_move(board.fen(), depth=safe_depth)
            
            if ai_uci:
                ai_move = chess.Move.from_uci(ai_uci)
                board.push(ai_move)
                await redis.set(redis_key, board.fen())
                
                await websocket.send_json({"type": "move", "move": ai_uci, "fen": board.fen()})

                if board.is_game_over():
                    await handle_game_over(board, game_id, winner_id=data["opponent_id"], loser_id=data["player_id"], websocket=websocket)
                    return
    else:
        await websocket.send_json({"type": "error", "message": "Illegal move!"})