from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from config import settings
from server import manager
from redis_client import get_redis
from ai_engine import compute_best_move
from matchmaking import matchmaking_loop
import asyncio
import json
import chess
from database import init_db
from models import Game, Tournament
from game_service import handle_game_over
from game_service import handle_player_move

app = FastAPI(debug=settings.debug)

@app.get("/")
def read_root():
    return {"message": "FastAPI Microservice is running!"}


@app.on_event("startup")
async def startup_event():
    print("FastAPI is starting up...")
    
    # 1. Automatically build the PostgreSQL tables reachging to .env for urls in separate volume for database (config directs to correct url)
    await init_db()
    
    # 2. Launch the matchmaking loop in the background
    asyncio.create_task(matchmaking_loop())


@app.websocket("/ws/game/{game_id}")
async def game_socket(websocket: WebSocket, game_id: int):
    await manager.connect(game_id, websocket)
    redis = await get_redis()

    redis_key = f"game:{game_id}:fen"
    current_fen = await redis.get(redis_key)
    
    if not current_fen:
        starting_fen = chess.Board().fen()
        await redis.set(redis_key, starting_fen)
        current_fen = starting_fen
        
    await websocket.send_json({"type": "board_state", "fen": current_fen})

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "move":
                await handle_player_move(data, game_id, websocket)

            elif msg_type == "join_queue":
                user_id = data.get("user_id")
                await redis.lpush("matchmaking_queue", user_id)
                await websocket.send_json({"type": "info", "message": "Joined queue!"})
            
            elif msg_type == "chat_message":
                #await broadcast_chat(data["text"])
                pass

            elif msg_type == "surrender":
                current_fen = await redis.get(redis_key)
                board = chess.Board(current_fen) if current_fen else chess.Board()
                
                opponent_id = data.get("opponent_id") # React must send this
                player_id = data.get("player_id") 

                await handle_game_over(board, game_id, winner_id=opponent_id, loser_id=player_id, websocket=websocket)

            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown message type: {msg_type}"
                })

    except WebSocketDisconnect:
        await manager.disconnect(game_id)

    except Exception as e:
        await manager.disconnect(game_id)
        print(f"WebSocket error for game {game_id}: {e}")
