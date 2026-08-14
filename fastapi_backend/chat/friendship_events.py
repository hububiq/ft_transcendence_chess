import asyncio
import json
import logging
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError
from redis.exceptions import RedisError

from chat.manager import global_chat_manager
from chat.schemas import FriendsChangedServerEvent
from redis_client import get_redis


logger = logging.getLogger(__name__)

FRIENDSHIP_EVENTS_CHANNEL = "friendship_events"
FRIENDSHIP_RECONNECT_DELAY_SECONDS = 5.0


class FriendshipChangedRedisEvent(BaseModel):
    """Validate internal friendship events received from Redis"""

    model_config = ConfigDict(
        extra="forbid",
        strict=True,
    )

    type: Literal["friends_changed"]

    user_ids: list[
        Annotated[int, Field(gt=0)]
    ] = Field(min_length=1)


async def _handle_friendship_event(
    raw_payload: object,
) -> None:
    if not isinstance(raw_payload, str):
        logger.warning(
            "Ignored friendship event with invalid payload type"
        )
        return

    try:
        decoded_payload = json.loads(raw_payload)

        event = FriendshipChangedRedisEvent.model_validate(
            decoded_payload
        )
    except (
        json.JSONDecodeError,
        ValidationError,
    ):
        logger.warning(
            "Ignored invalid friendship event"
        )
        return

    try:
        # Deliver the invalidation to every active socket of affected users
        await global_chat_manager.send_to_users(
            set(event.user_ids),
            FriendsChangedServerEvent(),
        )
    except Exception:
        logger.warning(
            "Failed to deliver friendship change event",
            exc_info=True,
        )


async def listen_for_friendship_events() -> None:
    """Forward Redis friendship events to authenticated WebSocket users"""

    while True:
        try:
            redis_conn = await get_redis()

            async with redis_conn.pubsub() as pubsub:
                await pubsub.subscribe(
                    FRIENDSHIP_EVENTS_CHANNEL
                )

                logger.info(
                    "Friendship event listener subscribed"
                )

                async for message in pubsub.listen():
                    if message.get("type") != "message":
                        continue

                    await _handle_friendship_event(
                        message.get("data")
                    )

        except RedisError:
            logger.warning(
                "Friendship event listener lost Redis connection",
                exc_info=True,
            )

            # Retry without terminating the FastAPI process
            await asyncio.sleep(
                FRIENDSHIP_RECONNECT_DELAY_SECONDS
            )