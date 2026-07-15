import json
import asyncio
from redis_client import get_redis
from database import async_session
from models import Game

async def matchmaking_loop():
    print("[MATCHMAKING] Listening on Redis queue...")
    redis = await get_redis()

    waiting_player_id = None


    while True:
      try:
        result = await redis.brpop("matchmaking_queue", timeout=3) #returns a tuple
        
        if not result:
            continue

        _, player_data = result #automatically assigns whatever there is (_) to index 0, and player_data to index 1
        joined_id = int(player_data) #casting because Redis is pure text database.

        if waiting_player_id == joined_id:
                continue

        if waiting_player_id is None:
            waiting_player_id = joined_id
            print(f"[MATCHMAKING] Player 1 waiting: {waiting_player_id}")
        else:
            print(f"[MATCHMAKING] Player 2 joined: {joined_id}")
            
            async with async_session() as session:
                new_game = Game(
                    white_player_id=waiting_player_id,
                    black_player_id=joined_id,
                    status="ongoing"
                )
                session.add(new_game)
                await session.commit()
                await session.refresh(new_game) # Gets the brand new ID!
                    
                official_game_id = new_game.id
            
            match_payload = {
                "game_id": official_game_id,
                "white_id": waiting_player_id,
                "black_id": joined_id
            }
            
            await redis.publish("match.start", json.dumps(match_payload))
            print(f"[MATCHMAKING] Match created: Game {official_game_id} ({waiting_player_id} vs {joined_id})")
            
            waiting_player_id = None

      except Exception as e:
          print(f"[MATCHMAKING ERROR] {e}")
          await asyncio.sleep(1)  #if something goes wrong, this prevents from errors piling up and breaking redis loop
