from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from config import settings
from server import manager
from redis_client import get_redis
from ai_engine import compute_best_move
from matchmaking import matchmaking_loop
import asyncio
import json
from database import init_db
from models import Game, Tournament 


app = FastAPI(debug=settings.debug)


# ---------------------------------------------------------
# ROOT ENDPOINT
# ---------------------------------------------------------
@app.get("/")
def read_root():
    return {"message": "FastAPI Microservice is running!"}


# ---------------------------------------------------------
# STARTUP: Launch matchmaking loop
# ---------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    print("🚀 FastAPI is starting up...")
    
    # 1. Automatically build the PostgreSQL tables reachging to .env for urls in separate volume for database (config directs to correct url)
    await init_db()
    
    # 2. Launch the matchmaking loop in the background
    asyncio.create_task(matchmaking_loop())
    # more tasks soon?
    # it is the place for background workers, like matchmaking loop or:
    # Inactive Game Cleaner: asyncio.create_task(clean_dead_games()) -> A loop that runs every 10 minutes, 
    # checks Redis for games where players haven't moved in 24 hours, and automatically declares them abandoned.


# ---------------------------------------------------------
# WEBSOCKET ENDPOINT
# ---------------------------------------------------------
@app.websocket("/ws/game/{user_id}")
async def game_socket(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    redis = await get_redis()

    try:
        while True:
            data = await websocket.receive_json()

            msg_type = data.get("type")

            # ---------------------------------------------------------
            # PLAYER MOVE → publish to Redis // OR PUSH??
            # ---------------------------------------------------------
            if msg_type == "move":
                await redis.publish("match.update", json.dumps(data))

            # ---------------------------------------------------------
            # AI REQUEST → compute best move
            # ---------------------------------------------------------
            elif msg_type == "ai_request":
                best_move = compute_best_move(data["board"])
                await websocket.send_json({
                    "type": "ai_move",
                    "move": best_move
                })

            # ---------------------------------------------------------
            # JOIN MATCHMAKING QUEUE
            # ---------------------------------------------------------
            elif msg_type == "join_queue":
                # Push the user_id into the Redis list
                await redis.lpush("matchmaking_queue", user_id)
                await websocket.send_json({
                    "type": "info",
                    "message": "Joined matchmaking queue!"
                })
            
            elif msg_type == "chat_message":
              # Do the chat logic
              await broadcast_chat(data["text"])

            elif msg_type == "surrender":
                # Do the surrender logic
                await end_game(loser_id=user_id)

            # ---------------------------------------------------------
            # UNKNOWN MESSAGE TYPE
            # ---------------------------------------------------------
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown message type: {msg_type}"
                })

    except WebSocketDisconnect:
        await manager.disconnect(user_id)

    except Exception as e:
        await manager.disconnect(user_id)
        print(f"WebSocket error for user {user_id}: {e}")
