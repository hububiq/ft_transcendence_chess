import asyncio
from sqlmodel import select
from database import async_session
from models import Game
from datetime import datetime, timedelta, timezone

async def clean_dead_games():
    """Background loop that runs every 10 minutes to close abandoned games."""
    print("🧹 Garbage Collector started!")
    
    while True:
        try:
            # Wait 10 minutes between sweeps (600 seconds)
            await asyncio.sleep(600) 
            
            async with async_session() as session:
                # Find games that are 'ongoing' but were created over 1 hour ago
                one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
                
                query = select(Game).where(
                    Game.status == "ongoing",
                    Game.played_at < one_hour_ago
                )
                result = await session.exec(query)
                dead_games = result.all()
                
                if dead_games:
                    for game in dead_games:
                        game.status = "abandoned"
                        session.add(game)
                        print(f"[CLEANUP] Game {game.id} marked as abandoned.")
                    
                    await session.commit()
                    
        except Exception as e:
            print(f"[CLEANUP ERROR] {e}")