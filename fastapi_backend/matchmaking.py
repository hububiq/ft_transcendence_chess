import json
import asyncio
from redis_client import get_redis
from database import async_session
from models import Game
from server import manager 

async def matchmaking_loop():
    print(f"[MATCHMAKING] Listening on Redis queue...")
    redis = await get_redis()

    waiting_player_id = None


    while True:
      try:
        result = await redis.brpop("matchmaking_queue", timeout=3) #returns a tuple
        
        if not result:
            continue

        _, player_data = result #automatically assigns whatever there is (_) to index 0, and player_data to index 1
        player_data = json.loads(player_data)
        joined_id = player_data["user_id"]
        joined_elo = player_data["elo_rating"]

        if await redis.sismember("cancelled_users", joined_id):
            await redis.srem("cancelled_users", joined_id)
            continue

        if waiting_player_id == joined_id:
                continue

        if waiting_player_id is None:
            waiting_player_id = joined_id
            print(f"[MATCHMAKING] Player 1 waiting: {waiting_player_id}")
        else:
            is_p1_cancelled = await redis.sismember("cancelled_users", waiting_player_id)
            if is_p1_cancelled:
                print(f"[MATCHMAKING] Player 1 ({waiting_player_id}) canceled! Discarding.")
                await redis.srem("cancelled_users", waiting_player_id) # Clean up
                # Player 1 is gone, so Player 2 becomes the new Player 1
                waiting_player_id = joined_id
                print(f"[MATCHMAKING] Player 1 waiting: {waiting_player_id}")
                continue # Go back to waiting for another player
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
            
            # Tell Player 1 (White) what room to go to
            await manager.send_to_user(waiting_player_id, {
                "type": "match_start",
                "game_id": official_game_id,
                "color": "white"
            })
                
            # Tell Player 2 (Black) what room to go to
            await manager.send_to_user(joined_id, {
                "type": "match_start",
                "game_id": official_game_id,
                "color": "black"
            })

            print(f"[MATCHMAKING] Match created: Game {official_game_id} ({waiting_player_id} vs {joined_id})")
            
            waiting_player_id = None

      except Exception as e:
          print(f"[MATCHMAKING ERROR] {e}")
          await asyncio.sleep(1)  #if something goes wrong, this prevents from errors piling up and breaking redis loop
