import asyncio
import json
import logging
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    ValidationError,
)
from redis.exceptions import RedisError

from chat.manager import global_chat_manager
from chat.schemas import (
    ChatAuthor,
    USERNAME_MAX_LENGTH,
    UserIdentityChangedServerEvent,
)
from redis_client import get_redis


logger = logging.getLogger(__name__)

USER_IDENTITY_EVENTS_CHANNEL = "user_identity_events"
USER_IDENTITY_RECONNECT_DELAY_SECONDS = 5.0


class UserIdentityChangedRedisEvent(BaseModel):
    """Validate internal identity events received from Redis"""

    model_config = ConfigDict(
        extra="forbid",
        strict=True,
    )

    type: Literal["user_identity_changed"]

    user_id: Annotated[
        int,
        Field(gt=0),
    ]

    username: str = Field(
        min_length=1,
        max_length=USERNAME_MAX_LENGTH,
    )


def _parse_identity_event(
    raw_payload: object,
) -> UserIdentityChangedRedisEvent | None:
    """Parse one Redis payload without trusting internal transport data"""

    if not isinstance(raw_payload, str):
        logger.warning(
            "Ignored user identity event with invalid payload type"
        )
        return None

    try:
        decoded_payload = json.loads(
            raw_payload
        )

        return (
            UserIdentityChangedRedisEvent.model_validate(
                decoded_payload
            )
        )

    except (
        json.JSONDecodeError,
        ValidationError,
    ):
        logger.warning(
            "Ignored invalid user identity event"
        )
        return None


async def _sync_chat_identity(
    user: ChatAuthor,
) -> None:
    """Synchronize the trusted identity stored by the chat manager"""

    has_active_connection = (
        await global_chat_manager.update_user_identity(
            user
        )
    )

    if has_active_connection:
        await global_chat_manager.broadcast_presence()


async def _notify_identity_change(
    user: ChatAuthor,
) -> None:
    """Notify connected clients that cached identity data may be stale"""

    await global_chat_manager.broadcast(
        UserIdentityChangedServerEvent(
            user=user,
        )
    )


async def _handle_identity_event(
    event: UserIdentityChangedRedisEvent,
) -> None:
    """Apply one validated identity event to realtime chat state"""

    user = ChatAuthor(
        id=event.user_id,
        username=event.username,
    )

    await _sync_chat_identity(user)
    await _notify_identity_change(user)


async def listen_for_user_identity_events() -> None:
    """Forward Redis identity events to authenticated WebSocket users"""

    while True:
        try:
            redis_conn = await get_redis()

            async with redis_conn.pubsub() as pubsub:
                await pubsub.subscribe(
                    USER_IDENTITY_EVENTS_CHANNEL
                )

                logger.info(
                    "User identity event listener subscribed"
                )

                async for message in pubsub.listen():
                    if (
                        message.get("type")
                        != "message"
                    ):
                        continue

                    event = _parse_identity_event(
                        message.get("data")
                    )

                    if event is None:
                        continue

                    try:
                        await _handle_identity_event(
                            event
                        )
                    except Exception:
                        logger.warning(
                            "Failed to deliver user identity change event",
                            exc_info=True,
                        )

        except RedisError:
            logger.warning(
                "User identity event listener lost Redis connection",
                exc_info=True,
            )

            # Retry without terminating the FastAPI process
            await asyncio.sleep(
                USER_IDENTITY_RECONNECT_DELAY_SECONDS
            )