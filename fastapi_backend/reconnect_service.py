import asyncio
import time
from datetime import datetime, timezone
from typing import Dict, Tuple

import chess
from fastapi import WebSocket
from sqlmodel import or_, select

from chat.manager import global_chat_manager
from chat.schemas import (
    ActiveGameChangedServerEvent,
    GameReconnectPendingServerEvent,
    GameReconnectedServerEvent,
)

from database import async_session
from game_service import handle_game_over
from models import Game
from redis_client import get_redis
from server import manager


RECONNECT_GRACE_SECONDS = 60
RECONNECT_DEADLINES_KEY = "game:reconnect:deadlines"
RECONNECT_WORKER_INTERVAL_SECONDS = 1

# Serialize reconnect and timeout resolution for the same player in the same game
_player_locks: Dict[Tuple[int, int], asyncio.Lock] = {}


def _deadline_member(game_id: int, user_id: int) -> str:
    return f"{game_id}:{user_id}"


def _player_lock(game_id: int, user_id: int) -> asyncio.Lock:
    key = (game_id, user_id)
    lock = _player_locks.get(key)

    if lock is None:
        lock = asyncio.Lock()
        _player_locks[key] = lock

    return lock


async def _is_reconnect_eligible_game(
    game: Game,
    user_id: int,
    redis,
) -> bool:
    if game.status != "ongoing":
        return False

    if game.is_local_1v1:
        return False

    if game.black_player_id is None:
        return False

    if user_id not in {
        game.white_player_id,
        game.black_player_id,
    }:
        return False

    if game.tournament_id is None:
        return True

    # Tournament reconnect starts only after both authenticated players entered the game
    return bool(
        await redis.exists(
            f"game:{game.id}:started"
        )
    )


async def register_game_connection(
    game_id: int,
    websocket: WebSocket,
    user_id: int,
) -> bool:
    lock = _player_lock(game_id, user_id)

    async with lock:
        # # Recheck the database inside the lock before accepting the reconnect
        # async with async_session() as session:
        #     game = await session.get(Game, game_id)

        #     if not game or game.status != "ongoing":
        #         return False
        async with async_session() as session:
            game = await session.get(Game, game_id)

            if not game or game.status != "ongoing":
                return False

            player_ids = {
                player_id
                for player_id in (
                    game.white_player_id,
                    game.black_player_id,
                )
                if player_id is not None
            }

        # Register the socket before clearing the deadline so the worker sees the player as connected
        await manager.connect(
            game_id,
            websocket,
            user_id,
        )

        # redis = await get_redis()
        # await redis.zrem(
        #     RECONNECT_DEADLINES_KEY,
        #     _deadline_member(game_id, user_id),
        # )
        redis = await get_redis()

        started_now = False

        if (
            not game.is_local_1v1
            and game.black_player_id is not None
            and manager.has_game_connection(
                game_id,
                game.white_player_id,
            )
            and manager.has_game_connection(
                game_id,
                game.black_player_id,
            )
        ):
            # Persist that both authenticated players have entered this remote game
            started_now = bool(
                await redis.set(
                    f"game:{game_id}:started",
                    "1",
                    nx=True,
                )
            )

        removed_deadline = await redis.zrem(
            RECONNECT_DEADLINES_KEY,
            _deadline_member(game_id, user_id),
        )

        if removed_deadline:
            # Notify participants only when a real reconnect deadline was cancelled
            await global_chat_manager.send_to_users(
                player_ids,
                GameReconnectedServerEvent(
                    game_id=game_id,
                    reconnected_user_id=user_id,
                ),
            )

        if started_now and game.tournament_id is not None:
            # Refresh active-game UI only when a prepared tournament match actually starts
            await global_chat_manager.send_to_users(
                player_ids,
                ActiveGameChangedServerEvent(),
            )

    return True


async def unregister_game_connection(
    game_id: int,
    websocket: WebSocket,
    user_id: int,
) -> None:
    lock = _player_lock(game_id, user_id)

    async with lock:
        await manager.disconnect(
            game_id,
            websocket,
            user_id,
        )

        redis = await get_redis()
        member = _deadline_member(game_id, user_id)

        # Only the last game socket for this player may start the grace period
        if manager.has_game_connection(game_id, user_id):
            await redis.zrem(
                RECONNECT_DEADLINES_KEY,
                member,
            )
            return

        # Recheck the persisted game state after the socket has been removed
        async with async_session() as session:
            game = await session.get(Game, game_id)

            if (
                not game
                or not await _is_reconnect_eligible_game(
                    game,
                    user_id,
                    redis,
                )
            ):
                await redis.zrem(
                    RECONNECT_DEADLINES_KEY,
                    member,
                )
                return

            player_ids = {
                player_id
                for player_id in (
                    game.white_player_id,
                    game.black_player_id,
                )
                if player_id is not None
            }

        # Redis stores an absolute backend deadline rather than a frontend countdown
        deadline = time.time() + RECONNECT_GRACE_SECONDS

        await redis.zadd(
            RECONNECT_DEADLINES_KEY,
            {
                member: deadline,
            },
        )

        # Publish the backend deadline only after Redis stores the authoritative value
        await global_chat_manager.send_to_users(
            player_ids,
            GameReconnectPendingServerEvent(
                game_id=game_id,
                disconnected_user_id=user_id,
                reconnect_deadline=datetime.fromtimestamp(
                    deadline,
                    tz=timezone.utc,
                ),
            ),
        )


async def _resolve_expired_deadline(
    game_id: int,
    user_id: int,
) -> None:
    lock = _player_lock(game_id, user_id)

    async with lock:
        redis = await get_redis()
        member = _deadline_member(game_id, user_id)

        # Re-read the deadline because it may have been cancelled by a reconnect
        deadline = await redis.zscore(
            RECONNECT_DEADLINES_KEY,
            member,
        )

        if deadline is None or deadline > time.time():
            return

        # Never forfeit a player who already has a valid game socket again
        if manager.has_game_connection(game_id, user_id):
            await redis.zrem(
                RECONNECT_DEADLINES_KEY,
                member,
            )
            return

        # Recheck PostgreSQL immediately before the authoritative timeout decision
        async with async_session() as session:
            game = await session.get(Game, game_id)

            if (
                not game
                or not await _is_reconnect_eligible_game(
                    game,
                    user_id,
                    redis,
                )
            ):
                await redis.zrem(
                    RECONNECT_DEADLINES_KEY,
                    member,
                )
                return

            player_ids = {
                player_id
                for player_id in (
                    game.white_player_id,
                    game.black_player_id,
                )
                if player_id is not None
            }

        current_fen = await redis.get(f"game:{game_id}:fen")
        board = chess.Board(current_fen) if current_fen else chess.Board()

        # Reuse the existing game completion flow instead of duplicating winner and persistence logic
        await handle_game_over(
            board,
            str(game_id),
            websocket=None,
            is_timeout=True,
            timeout_loser_id=user_id,
            is_disconnect_timeout=True,
        )

        # A completed game must not leave a pending deadline for either player
        await redis.zrem(
            RECONNECT_DEADLINES_KEY,
            *[
                _deadline_member(game_id, player_id)
                for player_id in player_ids
            ],
        )

async def get_reconnect_pending_events_for_user(
    user_id: int,
) -> list[GameReconnectPendingServerEvent]:
    # Rebuild only the currently active reconnect state after application socket recovery
    async with async_session() as session:
        query = (
            select(Game)
            .where(
                Game.status == "ongoing",
                Game.black_player_id.is_not(None),
                or_(
                    Game.white_player_id == user_id,
                    Game.black_player_id == user_id,
                ),
            )
            .order_by(Game.played_at.desc())
            .limit(1)
        )

        result = await session.execute(query)
        game = result.scalars().first()

        redis = await get_redis()


        if (
            game is None
            or not await _is_reconnect_eligible_game(
                game,
                user_id,
                redis,
            )
        ):
            return []

        player_ids = [
            player_id
            for player_id in (
                game.white_player_id,
                game.black_player_id,
            )
            if player_id is not None
        ]

    events: list[GameReconnectPendingServerEvent] = []

    # Send the user's own deadline last so it takes priority when both players disconnected
    ordered_player_ids = [
        player_id
        for player_id in player_ids
        if player_id != user_id
    ]

    if user_id in player_ids:
        ordered_player_ids.append(user_id)

    for disconnected_user_id in ordered_player_ids:
        deadline = await redis.zscore(
            RECONNECT_DEADLINES_KEY,
            _deadline_member(
                game.id,
                disconnected_user_id,
            ),
        )

        if deadline is None:
            continue

        events.append(
            GameReconnectPendingServerEvent(
                game_id=game.id,
                disconnected_user_id=disconnected_user_id,
                reconnect_deadline=datetime.fromtimestamp(
                    deadline,
                    tz=timezone.utc,
                ),
            )
        )

    return events

async def reconnect_deadline_worker() -> None:
    while True:
        try:
            redis = await get_redis()
            now = time.time()

            # Read only deadlines that are already due instead of scanning Redis keys
            expired_members = await redis.zrangebyscore(
                RECONNECT_DEADLINES_KEY,
                "-inf",
                now,
            )

            for member in expired_members:
                try:
                    game_id_text, user_id_text = member.split(":", 1)

                    await _resolve_expired_deadline(
                        int(game_id_text),
                        int(user_id_text),
                    )
                except (TypeError, ValueError):
                    # Remove malformed entries that cannot identify a game and player
                    await redis.zrem(
                        RECONNECT_DEADLINES_KEY,
                        member,
                    )
                except Exception as exc:
                    print(
                        "[RECONNECT] Failed to resolve "
                        f"deadline {member}: {exc}"
                    )

            await asyncio.sleep(
                RECONNECT_WORKER_INTERVAL_SECONDS
            )
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            # Keep the worker alive after transient Redis or database failures
            print(f"[RECONNECT] Worker error: {exc}")
            await asyncio.sleep(
                RECONNECT_WORKER_INTERVAL_SECONDS
            )