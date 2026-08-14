import logging

from redis.exceptions import RedisError

from redis_client import publish


logger = logging.getLogger(__name__)

FRIENDSHIP_EVENTS_CHANNEL = "friendship_events"


def publish_friendship_change(user_ids: list[int]) -> None:
    payload = {
        "type": "friends_changed",
        "user_ids": user_ids,
    }

    try:
        # Redis only notifies clients while Django remains the friendship source of truth
        publish(FRIENDSHIP_EVENTS_CHANNEL, payload)
    except RedisError as exc:
        # Keep the friendship mutation successful when realtime delivery is unavailable
        logger.warning(
            "Failed to publish friendship change event: %s",
            exc,
        )