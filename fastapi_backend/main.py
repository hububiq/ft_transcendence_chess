from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from config import settings
from server import manager
from redis_client import get_redis
from ai_engine import compute_best_move
from matchmaking import matchmaking_loop
import asyncio
import json

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

            # ---------------------------------------------------------
            # PLAYER MOVE → publish to Redis
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
