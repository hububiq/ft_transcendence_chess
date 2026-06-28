import json
import asyncio
from redis_client import get_pubsub, get_redis


queue: list[int] = []


async def matchmaking_loop():
    """
    Listens for players joining the matchmaking queue via Redis Pub/Sub.
    When two players are available, pairs them and publishes a match.start event.
    """
    print("[MATCHMAKING] Listening on channel: queue.join")

    async for message in get_pubsub("queue.join"):
        try:
            user_id = int(message)
            print(f"[MATCHMAKING] Player joined queue: {user_id}")
            queue.append(user_id)

            # If two players are available → create match
            if len(queue) >= 2:
                white_id = queue.pop(0)
                black_id = queue.pop(0)

                match_payload = {
                    "white_id": white_id,
                    "black_id": black_id
                }

                redis = await get_redis()
                await redis.publish("match.start", json.dumps(match_payload))

                print(f"[MATCHMAKING] Match created: {white_id} vs {black_id}")

        except Exception as e:
            print(f"[MATCHMAKING ERROR] {e}")
            await asyncio.sleep(0.1)
