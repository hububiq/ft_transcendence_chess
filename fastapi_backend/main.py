# fastapi_backend/main.py

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

# ---------------------------------------------------------
# IMPORT YOUR REST ROUTERS
# ---------------------------------------------------------
from api.history import router as history_router
from api.tournaments import router as tournaments_router


app = FastAPI(debug=settings.debug)


# ---------------------------------------------------------
# REGISTER REST ROUTERS
# ---------------------------------------------------------
app.include_router(history_router)
app.include_router(tournaments_router)


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
    
    # 1. Build PostgreSQL tables
    await init_db()
    
    # 2. Launch matchmaking loop
    asyncio.create_task(matchmaking_loop())


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

            if msg_type == "move":
                await redis.publish("match.update", json.dumps(data))

            elif msg_type == "ai_request":
                best_move = compute_best_move(data["board"])
                await websocket.send_json({
                    "type": "ai_move",
                    "move": best_move
                })

            elif msg_type == "join_queue":
                await redis.lpush("matchmaking_queue", user_id)
                await websocket.send_json({
                    "type": "info",
                    "message": "Joined matchmaking queue!"
                })

            elif msg_type == "chat_message":
                await broadcast_chat(data["text"])

            elif msg_type == "surrender":
                await end_game(loser_id=user_id)

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
