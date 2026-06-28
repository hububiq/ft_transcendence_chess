from typing import AsyncGenerator
from config import settings
import aioredis


# ---------------------------------------------------------
# Create a single global Redis connection pool
# ---------------------------------------------------------
redis_pool = None


async def get_redis():
    """
    Returns a Redis connection from a global async pool.
    Ensures we don't create a new connection for every request.
    """
    global redis_pool

    if redis_pool is None:
        redis_pool = await aioredis.from_url(
            f"redis://{settings.redis_host}:{settings.redis_port}",
            decode_responses=True
        )

    return redis_pool


# ---------------------------------------------------------
# Pub/Sub helper (async generator)
# ---------------------------------------------------------
async def get_pubsub(channel: str) -> AsyncGenerator:
    """
    Subscribes to a Redis Pub/Sub channel and yields messages.
    Used by matchmaking and game update listeners.
    """
    redis = await get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe(channel)

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                yield message["data"]
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
