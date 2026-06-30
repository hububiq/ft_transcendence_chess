import json
import asyncio
from redis_client import get_redis


queue: list[int] = []


async def matchmaking_loop():
    print("[MATCHMAKING] Listening on Redis queue...")
    redis = await get_redis()

    waiting_player_id = None


    while True:
      try:
        result = await redis.brpop("matchmaking_queue", timeout=3)
        
        if not result:
            continue

        _, player_data = result
        joined_id = int(player_data)

        if waiting_player_id is None:
            # Nobody is waiting yet. This person is Player 1
            waiting_player_id = joined_id
            print(f"[MATCHMAKING] Player 1 waiting: {waiting_player_id}")
        else:
            # Someone was already waiting! This is Player 2
            print(f"[MATCHMAKING] Player 2 joined: {joined_id}")
            
            match_payload = {
                "white_id": waiting_player_id,
                "black_id": joined_id
            }
            
            # Announce the match
            await redis.publish("match.start", json.dumps(match_payload))
            print(f"[MATCHMAKING] Match created: {waiting_player_id} vs {joined_id}")
            
            # Reset the waiting room for the next pair!
            waiting_player_id = None

      except Exception as e:
          print(f"[MATCHMAKING ERROR] {e}")
          await asyncio.sleep(1)
