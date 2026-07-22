from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
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

# NEW: import tournament advancement
from game_service import handle_game_over, handle_player_move, advance_tournament_round

from api.history import router as history_router
from api.tournaments import router as tournaments_router
from api.games import router as games_router
from garbage_games_collector import clean_dead_games


app = FastAPI(debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1.3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(history_router)
app.include_router(tournaments_router)
app.include_router(games_router)


@app.get("/")
def read_root():
    return {"message": "FastAPI Microservice is running!"}


@app.on_event("startup")
async def startup_event():
    print("FastAPI is starting up...")

    await init_db()

    asyncio.create_task(matchmaking_loop())
    asyncio.create_task(clean_dead_games())

    # NEW: tournament listener for automatic round advancement
    asyncio.create_task(tournament_event_listener())


# NEW: Redis listener for tournament advancement
async def tournament_event_listener():
    redis = await get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe("tournament.match.completed")

    async for msg in pubsub.listen():
        try:
            data = json.loads(msg["data"])
            tournament_id = data["tournament_id"]
            round_number = data["round_number"]

            await advance_tournament_round(tournament_id, round_number)

        except Exception as e:
            print("Tournament advancement error:", e)


@app.websocket("/ws/lobby/{user_id}")
async def lobby_socket(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    redis = await get_redis()
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "join_queue":
                await redis.lpush("matchmaking_queue", user_id)
                await websocket.send_json({"type": "info", "message": "Joined matchmaking queue!"})
    except WebSocketDisconnect:
        await manager.disconnect(user_id)
    except Exception:
        await manager.disconnect(user_id, websocket)


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
                await websocket.send_json({"type": "info", "message": "Joined matchmaking queue!"})

            elif msg_type == "surrender":
                current_fen = await redis.get(redis_key)
                board = chess.Board(current_fen) if current_fen else chess.Board()

                opponent_id = data.get("opponent_id")
                player_id = data.get("player_id")

                # handle_game_over now triggers tournament advancement internally
                await handle_game_over(board, game_id, winner_id=opponent_id, loser_id=player_id, websocket=websocket)

            else:
                await websocket.send_json({"type": "error", "message": f"Unknown message type: {msg_type}"})

    except WebSocketDisconnect:
        await manager.disconnect(game_id, websocket)

    except Exception as e:
        await manager.disconnect(game_id, websocket)
        print(f"WebSocket error for game {game_id}: {e}")
