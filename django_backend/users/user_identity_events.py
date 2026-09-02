import logging

from redis.exceptions import RedisError

from redis_client import publish

from .models import User


logger = logging.getLogger(__name__)

USER_IDENTITY_EVENTS_CHANNEL = "user_identity_events"


def publish_user_identity_change(
    user: User,
) -> None:
    """Publish one persisted username change for realtime consumers"""

    payload = {
        "type": "user_identity_changed",
        "user_id": user.id,
        "username": user.username,
    }

    try:
        # Redis carries realtime invalidation while Django remains the identity source of truth
        publish(
            USER_IDENTITY_EVENTS_CHANNEL,
            payload,
        )
    except RedisError as exc:
        # Keep the profile mutation successful when realtime delivery is unavailable
        logger.warning(
            "Failed to publish user identity change event: %s",
            exc,
        )