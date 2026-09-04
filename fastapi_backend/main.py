from dataclasses import dataclass
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
from game_service import MULTIPLAYER_CLOCK_SECONDS
from api.history import router as history_router
from api.statistics_history import router as statistics_history_router
from api.tournaments import router as tournaments_router
from api.games import router as games_router
from garbage_games_collector import clean_dead_games
from database import async_session
from chat.router import router as chat_router
from chat.friendship_events import listen_for_friendship_events
from chat.user_identity_events import listen_for_user_identity_events
from reconnect_service import (
    reconnect_deadline_worker,
    register_game_connection,
    unregister_game_connection,
)
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
		"http://10.13.5.3:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(history_router)
app.include_router(statistics_history_router)
app.include_router(tournaments_router)
app.include_router(games_router)
app.include_router(chat_router)  # Expose the /ws/chat endpoint
asyncio.create_task(friendship_notifications_loop())


# ---------------------------------------------------------
# HELPER FUNCTIONS FOR REMATCHES
# ---------------------------------------------------------
async def process_rematch_request(game_id: int, user_id: int, opponent_id: int):
    """Handles logic when a player asks for a rematch."""
    if opponent_id is None:
        pass
    else:
        room_connections = manager.rooms.get(game_id, [])
        
        if len(room_connections) < 2:
            # The opponent left the room
            await manager.send_to_user(user_id, {"type": "opponent_gone"})
        else:
            redis = await get_redis()
            #  SAVE THE OFFER TO REDIS (Expires in 120 seconds!)
            await redis.set(f"game:{game_id}:rematch_proposed_by", user_id, ex=120)
            print(f"🚨 DEBUG SAVE: Wrote rematch offer to Redis for game {game_id} by user {user_id}")
            # They are still here
            await manager.send_to_user(opponent_id, {"type": "rematch_request"})
            # Tell the sender that the request is successfully pending
            await manager.send_to_user(user_id, {"type": "rematch_request_sent"})


async def process_rematch_accepted(game_id: int):
    """Creates a new game with swapped colors and broadcasts the new ID."""
    room_connections = manager.rooms.get(int(game_id), [])
    if len(room_connections) < 2:
        # The original requester ran away! Abort!
        await manager.broadcast_to_game(game_id, {"type": "opponent_gone"})
        return

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
    asyncio.create_task(listen_for_user_identity_events())

    # Resume processing Redis reconnect deadlines whenever FastAPI starts
    asyncio.create_task(reconnect_deadline_worker())


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
async def _authenticate_game_socket(
    websocket: WebSocket,
) -> int | None:
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
        return None
    except WebSocketDisconnect:
        return None
    except Exception:
        await websocket.close(
            code=1008,
            reason="Invalid authentication message",
        )
        return None

    if (
        not isinstance(auth_payload, dict)
        or auth_payload.get("type") != "authenticate"
    ):
        await websocket.close(
            code=1008,
            reason="Authentication required",
        )
        return None

    access_token = auth_payload.get("access_token")

    if not isinstance(access_token, str) or not access_token.strip():
        await websocket.close(
            code=1008,
            reason="Authentication required",
        )
        return None

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
        return None

    # Use only the user identity verified from the access token
    return current_user.id


# Keep related game state together instead of returning an error-prone positional tuple
@dataclass
class _GameSocketContext:
    color: str
    opponent_id: int | None
    is_completed: bool
    winner_id: int | None
    loser_id: int | None
    result: str | None
    saved_pgn: str
    is_draw: bool
    tournament_id: int | None


async def _load_and_validate_game_socket_context(
    websocket: WebSocket,
    game_id: int,
    user_id: int,
) -> _GameSocketContext | None:
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
            return None

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
            return None

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
            return None

    return _GameSocketContext(
        color=color,
        opponent_id=opponent_id,
        is_completed=is_completed,
        winner_id=winner_id,
        loser_id=loser_id,
        result=result,
        saved_pgn=saved_pgn,
        is_draw=is_draw,
        tournament_id=tournament_id,
    )


async def _register_game_socket_connection(
    websocket: WebSocket,
    game_id: int,
    user_id: int,
    is_completed: bool,
) -> bool:
    if is_completed:
        # Keep completed games on the existing connection path without reconnect grace
        await manager.connect(
            game_id,
            websocket,
            user_id,
        )
        return True

    # Register ongoing games through reconnect lifecycle so a valid return cancels the deadline
    is_registered = await register_game_connection(
        game_id,
        websocket,
        user_id,
    )

    if not is_registered:
        await websocket.close(
            code=1008,
            reason="Game is not active",
        )
        return False

    return True


async def _send_completed_game_initial_state(
    websocket: WebSocket,
    redis,
    game_id: int,
    user_id: int,
    game_context: _GameSocketContext,
) -> None:
    final_fen = chess.Board().fen()

    # Rebuild the final board from persisted PGN because completed games should not depend on Redis board state
    if game_context.saved_pgn:
        pgn_io = io.StringIO(game_context.saved_pgn)
        parsed_game = chess.pgn.read_game(pgn_io)

        if parsed_game:
            final_board = parsed_game.end().board()
            final_fen = final_board.fen()

    await websocket.send_json({
        "type": "board_state",
        "fen": final_fen,
        "color": game_context.color,
        "opponent_id": game_context.opponent_id,
        "history": [],
    })

    rematch_state = "idle"
    proposed_by = await redis.get(f"game:{game_id}:rematch_proposed_by")

    print(
        f"🚨 DEBUG LOAD: Refresh triggered! "
        f"Redis says proposed_by is: {proposed_by}"
    )

    if proposed_by:
        if int(proposed_by) == game_context.opponent_id:
            rematch_state = "received"
            await manager.send_to_user(game_context.opponent_id, {"type": "rematch_request_sent"})
        elif int(proposed_by) == user_id:
            rematch_state = "sent"
            await manager.send_to_user(game_context.opponent_id, {"type": "rematch_request"})

    print(
        f"🚨 DEBUG SEND: Telling React that "
        f"rematch_state is: {rematch_state}"
    )

    await websocket.send_json({
        "type": "game_over",
        "winner_id": game_context.winner_id,
        "loser_id": game_context.loser_id,
        "result": game_context.result,
        "pgn": game_context.saved_pgn,
        "rematch_state": rematch_state,
    })


async def _send_ongoing_game_initial_state(
    websocket: WebSocket,
    redis,
    game_id: int,
    user_id: int,
    game_context: _GameSocketContext,
) -> str | None:
    redis_key = f"game:{game_id}:fen"
    current_fen = await redis.get(redis_key)

    if not current_fen:
        starting_fen = chess.Board().fen()
        await redis.set(redis_key, starting_fen)
        current_fen = starting_fen

        time_data = {
            "white_time": MULTIPLAYER_CLOCK_SECONDS,
            "black_time": MULTIPLAYER_CLOCK_SECONDS,
            "last_move_at": None,
        }
        await redis.set(f"game:{game_id}:time", json.dumps(time_data))

    # Rebuild move history from Redis so reconnecting clients receive the current game state
    moves_key = f"game:{game_id}:moves"
    raw_moves_uci = await redis.lrange(
        moves_key,
        0,
        -1,
    )

    # Convert persisted UCI moves into SAN for the frontend history
    san_history = []
    temp_board = chess.Board()

    for move_uci in raw_moves_uci:
        move_obj = chess.Move.from_uci(move_uci)
        san_history.append(temp_board.san(move_obj))
        temp_board.push(move_obj)

    white_time = MULTIPLAYER_CLOCK_SECONDS
    black_time = MULTIPLAYER_CLOCK_SECONDS

    time_data_str = await redis.get(f"game:{game_id}:time")

    if time_data_str:
        td = json.loads(time_data_str)
        white_time = td["white_time"]
        black_time = td["black_time"]

        # Deduct elapsed time only after White has made the first move
        if (
            len(raw_moves_uci) > 0
            and td.get("last_move_at") is not None
        ):
            time_spent = (int(time.time()) - td["last_move_at"])
            board_for_time = chess.Board(current_fen)

            if board_for_time.turn == chess.WHITE:
                white_time -= time_spent
            else:
                black_time -= time_spent

    try:
        await websocket.send_json({
            "type": "board_state",
            "fen": current_fen,
            "color": game_context.color,
            "opponent_id": game_context.opponent_id,
            "tournament_id": game_context.tournament_id,
            "history": san_history,
            "white_time": max(0, white_time),
            "black_time": max(0, black_time),
        })
    except Exception as e:
        print(f"[WS] Browser disconnected before receiving board state: {e}")

        # Treat connection loss during initial state delivery as a reconnectable disconnect
        await unregister_game_connection(
            game_id,
            websocket,
            user_id,
        )
        return None

    return redis_key


async def _handle_game_socket_disconnect(
    game_id: int,
    websocket: WebSocket,
    user_id: int,
) -> None:
    # Start reconnect handling only after an authenticated game socket actually disconnects
    await unregister_game_connection(
        game_id,
        websocket,
        user_id,
    )

    await asyncio.sleep(2)

    room_connections = manager.rooms.get(
        game_id,
        [],
    )

    if len(room_connections) < 2:
        await manager.broadcast_to_game(
            game_id,
            {
                "type": "opponent_gone",
            },
        )


async def _handle_game_socket_error(
    game_id: int,
    websocket: WebSocket,
    user_id: int,
    error: Exception,
) -> None:
    await manager.disconnect(
        game_id,
        websocket,
        user_id,
    )

    await asyncio.sleep(2)

    room_connections = manager.rooms.get(
        game_id,
        [],
    )

    if len(room_connections) < 2:
        await manager.broadcast_to_game(game_id, {"type": "opponent_gone"})

    print(f"WebSocket error for game {game_id}: {error}")


async def _handle_rematch_game_message(
    msg_type: str,
    redis,
    game_id: int,
    user_id: int,
    opponent_id: int | None,
) -> None:
    if msg_type == "rematch_request":
        print(
            f"🚨 DEBUG WS: React sent rematch_request "
            f"for Game {game_id}"
        )
        await process_rematch_request(
            game_id,
            user_id,
            opponent_id,
        )

    elif msg_type == "rematch_declined":
        print(
            f"🚨 DEBUG WS: React sent rematch_declined "
            f"for Game {game_id}"
        )
        await redis.delete(f"game:{game_id}:rematch_proposed_by")

        if opponent_id is not None:
            await manager.send_to_user(opponent_id, {"type": "rematch_declined"})

    elif msg_type == "rematch_accepted":
        print(
            f"🚨 DEBUG WS: React sent rematch_accepted "
            f"for Game {game_id}"
        )
        await redis.delete(f"game:{game_id}:rematch_proposed_by")
        await process_rematch_accepted(game_id)


async def _forward_draw_game_message(
    msg_type: str,
    opponent_id: int | None,
) -> None:
    if msg_type == "offer_draw":
        await manager.send_to_user(opponent_id, {"type": "draw_offer"})

    elif msg_type == "draw_declined":
        if opponent_id is not None:
            await manager.send_to_user(opponent_id, {"type": "draw_declined"})


async def _handle_draw_accepted_game_message(
    redis,
    redis_key: str,
    game_id: int,
    websocket: WebSocket,
) -> None:
    current_fen = await redis.get(redis_key)
    board = (
        chess.Board(current_fen)
        if current_fen
        else chess.Board()
    )

    await handle_game_over(
        board,
        game_id,
        websocket=websocket,
        is_agreed_draw=True,
    )


async def _handle_surrender_game_message(
    redis,
    redis_key: str,
    game_id: int,
    websocket: WebSocket,
    user_id: int,
) -> None:
    current_fen = await redis.get(redis_key)
    board = (
        chess.Board(current_fen)
        if current_fen
        else chess.Board()
    )

    # Use the authenticated socket identity as the surrendering player
    await handle_game_over(
        board,
        game_id,
        websocket=websocket,
        is_surrender=True,
        surrender_loser_id=user_id,
    )


@app.websocket("/ws/game/{game_id}")
async def game_socket(websocket: WebSocket, game_id: int):
    await websocket.accept()

    user_id = await _authenticate_game_socket(websocket)

    if user_id is None:
        return

    game_context = await _load_and_validate_game_socket_context(
        websocket,
        game_id,
        user_id,
    )

    if game_context is None:
        return

    opponent_id = game_context.opponent_id
    is_completed = game_context.is_completed

    connection_ready = await _register_game_socket_connection(
        websocket,
        game_id,
        user_id,
        is_completed,
    )

    if not connection_ready:
        return

    redis = await get_redis()
    
    try:
        if is_completed:
            await _send_completed_game_initial_state(
                websocket,
                redis,
                game_id,
                user_id,
                game_context,
            )
        else:
            redis_key = await _send_ongoing_game_initial_state(
                websocket,
                redis,
                game_id,
                user_id,
                game_context,
            )

            if redis_key is None:
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
                await _handle_surrender_game_message(
                    redis,
                    redis_key,
                    game_id,
                    websocket,
                    user_id,
                )

            elif msg_type == "claim_timeout":
                print(f"[WS] Received timeout claim from user for Game {game_id}!")
                await handle_timeout_claim(data, str(game_id), websocket)

            elif msg_type in {
                "rematch_request",
                "rematch_declined",
                "rematch_accepted",
            }:
                await _handle_rematch_game_message(
                    msg_type,
                    redis,
                    game_id,
                    user_id,
                    opponent_id,
                )

            elif msg_type in {
                "offer_draw",
                "draw_declined",
            }:
                await _forward_draw_game_message(
                    msg_type,
                    opponent_id,
                )

            elif msg_type == "draw_accepted":
                await _handle_draw_accepted_game_message(
                    redis,
                    redis_key,
                    game_id,
                    websocket,
                )

            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown message type: {msg_type}"
                })

    except WebSocketDisconnect:
        await _handle_game_socket_disconnect(
            game_id,
            websocket,
            user_id,
        )

    except Exception as e:
        await _handle_game_socket_error(
            game_id,
            websocket,
            user_id,
            e,
        )
