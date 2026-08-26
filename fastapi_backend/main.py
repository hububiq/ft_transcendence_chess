from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from server import manager
from redis_client import get_redis
from ai_engine import compute_best_move
from matchmaking import matchmaking_loop
import asyncio
import json
import io
import chess
from database import init_db
from models import Game, Tournament
from game_service import handle_game_over, handle_timeout_claim, handle_player_move
from game_service import handle_player_move
from api.history import router as history_router
from api.tournaments import router as tournaments_router
from api.games import router as games_router
from garbage_games_collector import clean_dead_games
from database import async_session
from chat.router import router as chat_router
from chat.friendship_events import listen_for_friendship_events
from auth import get_current_user
import time
from notifications import friendship_notifications_loop


app = FastAPI(debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://10.18.200.89:3000",  # for campus 1vs1 2 machines testing - add your own IP
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://10.13.9.2:3000",
        "http://172.29.45.254:3000",
		"http://10.11.6.2:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(history_router)
app.include_router(tournaments_router)
app.include_router(games_router)
app.include_router(chat_router)  # Expose the /ws/chat endpoint
asyncio.create_task(friendship_notifications_loop())


# ---------------------------------------------------------
# HELPER FUNCTIONS FOR REMATCHES
# ---------------------------------------------------------
async def process_rematch_request(user_id: int, opponent_id: int):
    """Handles logic when a player asks for a rematch."""
    if opponent_id is not None:
        await manager.send_to_user(opponent_id, {"type": "rematch_request"})


async def process_rematch_accepted(game_id: int):
    """Creates a new game with swapped colors and broadcasts the new ID."""
    async with async_session() as session:
        old_game = await session.get(Game, game_id)
        if old_game:
            new_white = old_game.black_player_id
            new_black = old_game.white_player_id
            
            new_game = Game(white_player_id=new_white, black_player_id=new_black, status="ongoing")
            session.add(new_game)
            await session.commit()
            await session.refresh(new_game)
            
            await manager.broadcast_to_game(game_id, {
                "type": "rematch_accepted",
                "new_game_id": new_game.id
            })

@app.get("/")
def read_root():
    return {"message": "FastAPI Microservice is running!"}


@app.on_event("startup")
async def startup_event():
    print("FastAPI is starting up...")

    await init_db()
    asyncio.create_task(matchmaking_loop())
    asyncio.create_task(clean_dead_games())
    asyncio.create_task(listen_for_friendship_events())


# ------------------------------------------------------------
# Lobby WebSocket
# ------------------------------------------------------------
@app.websocket("/ws/lobby/{user_id}")
async def lobby_socket(websocket: WebSocket, user_id: int):
    await manager.connect_lobby(user_id, websocket)
    redis = await get_redis()

    async def remove_from_queue():
        queue_items = await redis.lrange("matchmaking_queue", 0, -1)
        for item in queue_items:
            # Parse the JSON string back into a dictionary
            player_data = json.loads(item)
            if player_data.get("user_id") == user_id:
                await redis.lrem("matchmaking_queue", 0, item)
                print(f"[LOBBY] User {user_id} removed from matchmaking queue.")
                break
        # Tell the matchmaking loop to drop them if it's holding them
        await redis.sadd("cancelled_users", user_id)
        await redis.expire("cancelled_users", 60) # Auto-delete this note after 60 seconds
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "join_queue":
                await redis.srem("cancelled_users", user_id) 
                elo = data.get("elo_rating", 1200)
                queue_payload = json.dumps({
                    "user_id": user_id,
                    "elo_rating": elo
                })
                await redis.lpush("matchmaking_queue", queue_payload)
                await websocket.send_json({"type": "info", "message": "Joined matchmaking queue!"})

            elif data.get("type") == "leave_lobby":
                await remove_from_queue()
                await websocket.send_json({"type": "info", "message": "Left matchmaking queue."})

    except WebSocketDisconnect:
        await remove_from_queue()
        await manager.disconnect_lobby(user_id, websocket)

    except Exception as e:
        await remove_from_queue()
        await manager.disconnect_lobby(user_id, websocket)


# ------------------------------------------------------------
# Game WebSocket (game_id + user_id)
# ------------------------------------------------------------
@app.websocket("/ws/game/{game_id}")
async def game_socket(websocket: WebSocket, game_id: int):
    await websocket.accept()

    try:
        # Require authentication before registering the game connection
        auth_payload = await asyncio.wait_for(
            websocket.receive_json(),
            timeout=10,
        )
    except asyncio.TimeoutError:
        await websocket.close(
            code=1008,
            reason="Authentication timeout",
        )
        return
    except WebSocketDisconnect:
        return
    except Exception:
        await websocket.close(
            code=1008,
            reason="Invalid authentication message",
        )
        return

    if (
        not isinstance(auth_payload, dict)
        or auth_payload.get("type") != "authenticate"
    ):
        await websocket.close(
            code=1008,
            reason="Authentication required",
        )
        return

    access_token = auth_payload.get("access_token")

    if not isinstance(access_token, str) or not access_token.strip():
        await websocket.close(
            code=1008,
            reason="Authentication required",
        )
        return

    try:
        current_user = await get_current_user(
            HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials=access_token,
            )
        )
    except HTTPException:
        await websocket.close(
            code=1008,
            reason="Authentication failed",
        )
        return

    # Use only the user identity verified from the access token
    user_id = current_user.id

    color = "w"
    opponent_id = None
    is_completed = False
    winner_id = None
    loser_id = None
    result = None
    saved_pgn = ""
    is_draw = False

    tournament_id = None

    async with async_session() as session:
        game = await session.get(Game, game_id)

        if not game:
            await websocket.close(
                code=1008,
                reason="Game is not active",
            )
            return

        tournament_id = game.tournament_id

        # Use only the authenticated player's membership in this game
        if game.white_player_id == user_id:
            color = "w"
            opponent_id = game.black_player_id
        elif game.black_player_id == user_id:
            color = "b"
            opponent_id = game.white_player_id
        else:
            await websocket.close(
                code=1008,
                reason="User is not a player in this game",
            )
            return

        if game.status == "completed":
            is_completed = True
            winner_id = game.winner_id
            saved_pgn = game.moves_pgn
            is_draw = game.is_draw

            if is_draw:
                result = "1/2-1/2"
            elif winner_id == game.white_player_id:
                result = "1-0"
                loser_id = game.black_player_id
            else:
                # If Black won, OR if winner is None (Bot playing as Black won)
                result = "0-1"
                loser_id = game.white_player_id

        elif game.status != "ongoing":
            await websocket.close(
                code=1008,
                reason="Game is not active",
            )
            return

    # Register only an authenticated player belonging to the game
    await manager.connect(
        game_id,
        websocket,
        user_id,
    )

    redis = await get_redis()
    
    try:
        if is_completed:
            final_fen = chess.Board().fen() # Default to start
            # Don't touch Redis. We just tell React it's over
            if saved_pgn:
                pgn_io = io.StringIO(saved_pgn)
                parsed_game = chess.pgn.read_game(pgn_io)
                if parsed_game:
                    final_board = parsed_game.end().board()
                    final_fen = final_board.fen()

            await websocket.send_json({
                "type": "board_state",
                "fen": final_fen,
                "color": color,
                "opponent_id": opponent_id,
                "history": []
            })        
            await websocket.send_json({
                "type": "game_over",
                "winner_id": winner_id,
                "loser_id": loser_id,
                "result": result,
                "pgn": saved_pgn
            })
        else:
            redis_key = f"game:{game_id}:fen"
            current_fen = await redis.get(redis_key)
            if not current_fen:
                starting_fen = chess.Board().fen()
                await redis.set(redis_key, starting_fen)
                current_fen = starting_fen

                time_data = {
                    "white_time": 15, 
                    "black_time": 15, 
                    "last_move_at": int(time.time())
                }
                await redis.set(f"game:{game_id}:time", json.dumps(time_data))

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

            white_time = 15
            black_time = 15
    
            time_data_str = await redis.get(f"game:{game_id}:time")
            if time_data_str:
                td = json.loads(time_data_str)
                white_time = td["white_time"]
                black_time = td["black_time"]
                
                # Deduct the time spent on the current turn
                if len(raw_moves_uci) > 0:
                    time_spent = int(time.time()) - td["last_move_at"]
                    board_for_time = chess.Board(current_fen)
                    if board_for_time.turn == chess.WHITE:
                        white_time -= time_spent
                    else:
                        black_time -= time_spent

            try:
                await websocket.send_json({
                    "type": "board_state",
                    "fen": current_fen,
                    "color": color,            # Tells React to flip the board or not
                    "opponent_id": opponent_id,  # Tells React who they are playing
                    "tournament_id": tournament_id,
                    "history": san_history,
                    "white_time": max(0, white_time),
                    "black_time": max(0, black_time)
                })
            except Exception as e:
                print(f"[WS] Browser disconnected before receiving board state: {e}")
                await manager.disconnect(game_id, websocket, user_id)
                return

    except Exception as e:
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
                await handle_game_over(
                    board,
                    game_id,
                    websocket=websocket,
                    is_surrender=True,
                    surrender_loser_id=user_id,
                )

            elif msg_type == "claim_timeout":
                print(f"[WS] Received timeout claim from user for Game {game_id}!")
                await handle_timeout_claim(data, str(game_id), websocket)

            elif msg_type == "rematch_request":
                await process_rematch_request(user_id, opponent_id)

            elif msg_type == "rematch_declined":
                if opponent_id is not None:
                    await manager.send_to_user(
                        opponent_id,
                        {"type": "rematch_declined"},
                    )

            elif msg_type == "rematch_accepted":
                await process_rematch_accepted(game_id)

            elif msg_type == "offer_draw":
                await manager.send_to_user(
                    opponent_id,
                    {"type": "draw_offer"},
                )

            elif msg_type == "draw_declined":
                if opponent_id is not None:
                    await manager.send_to_user(
                        opponent_id,
                        {"type": "draw_declined"},
                    )

            elif msg_type == "draw_accepted":
                current_fen = await redis.get(redis_key)
                board = chess.Board(current_fen) if current_fen else chess.Board()
                await handle_game_over(
                    board,
                    game_id,
                    websocket=websocket,
                    is_agreed_draw=True,
                )

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

