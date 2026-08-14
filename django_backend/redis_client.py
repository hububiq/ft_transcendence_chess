import os
import json
import redis

redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "redis_broker"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True,
)

def publish(channel: str, payload: dict) -> None:
    redis_client.publish(channel, json.dumps(payload))
