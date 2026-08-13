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
from game_service import handle_game_over
from game_service import handle_player_move
from api.history import router as history_router
from api.tournaments import router as tournaments_router
from api.games import router as games_router
from garbage_games_collector import clean_dead_games
from database import async_session
from chat.router import router as chat_router 


app = FastAPI(debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://10.18.200.89:3000",  # for campus 1vs1 2 machines testing - add your own IP
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.0.178:3000",
        "http://192.168.1.25:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(history_router)
app.include_router(tournaments_router)
app.include_router(games_router)
app.include_router(chat_router)  # Expose the /ws/chat endpoint


@app.get("/")
def read_root():
    return {"message": "FastAPI Microservice is running!"}


@app.on_event("startup")
async def startup_event():
    print("FastAPI is starting up...")

    await init_db()
    asyncio.create_task(matchmaking_loop())
    asyncio.create_task(clean_dead_games())


# ------------------------------------------------------------
# Lobby WebSocket
# ------------------------------------------------------------
@app.websocket("/ws/lobby/{user_id}")
async def lobby_socket(websocket: WebSocket, user_id: int):
    await manager.connect_lobby(user_id, websocket)

    redis = await get_redis()
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "join_queue":
                elo = data.get("elo_rating", 1200)
                queue_payload = json.dumps({
                    "user_id": user_id,
                    "elo_rating": elo
                })
                await redis.lpush("matchmaking_queue", queue_payload)
                await websocket.send_json({"type": "info", "message": "Joined matchmaking queue!"})

    except WebSocketDisconnect:
        await manager.disconnect_lobby(user_id, websocket)

    except Exception as e:
        await manager.disconnect_lobby(user_id, websocket)


# ------------------------------------------------------------
# Game WebSocket (game_id + user_id)
# ------------------------------------------------------------
@app.websocket("/ws/game/{game_id}")
async def game_socket(websocket: WebSocket, game_id: int, user_id: int):
    # NEW: pass user_id into manager.connect()
    await manager.connect(game_id, websocket, user_id)

    redis = await get_redis()

    color = "w"
    opponent_id = None

    async with async_session() as session:
        game = await session.get(Game, game_id)
        if game:
            if game.white_player_id == user_id:
                color = "w"
                opponent_id = game.black_player_id
            else:
                color = "b"
                opponent_id = game.white_player_id

    redis_key = f"game:{game_id}:fen"
    current_fen = await redis.get(redis_key)
    if not current_fen:
        starting_fen = chess.Board().fen()
        await redis.set(redis_key, starting_fen)
        current_fen = starting_fen

     # GRAB THE HISTORY FROM REDIS 
    moves_key = f"game:{game_id}:moves"
    raw_moves_uci = await redis.lrange(moves_key, 0, -1)
    
    # Translate the UCI moves (e2e4) back into SAN (e4) for frontend history sidebar
    san_history = []
    temp_board = chess.Board()
    for move_uci in raw_moves_uci:
        move_obj = chess.Move.from_uci(move_uci)
        san_history.append(temp_board.san(move_obj))
        temp_board.push(move_obj)

    try:
        await websocket.send_json({
            "type": "board_state",
            "fen": current_fen,
            "color": color,            # Tells React to flip the board or not
            "opponent_id": opponent_id,  # Tells React who they are playing
            "history": san_history
        })
    except Exception as e:
        print(f"[WS] Browser disconnected before receiving board state: {e}")
        await manager.disconnect(game_id, websocket, user_id)
        return

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "move":
                await handle_player_move(data, game_id, websocket)

            elif msg_type == "chat_message":
                pass

            elif msg_type == "surrender":
                current_fen = await redis.get(redis_key)
                board = chess.Board(current_fen) if current_fen else chess.Board()
                player_id = data.get("player_id")
                await handle_game_over(board, game_id, websocket=websocket,
                                       is_surrender=True, surrender_loser_id=player_id)

            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown message type: {msg_type}"
                })

    except WebSocketDisconnect:
        await manager.disconnect(game_id, websocket, user_id)

    except Exception as e:
        await manager.disconnect(game_id, websocket, user_id)
        print(f"WebSocket error for game {game_id}: {e}")

