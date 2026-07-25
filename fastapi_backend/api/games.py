from fastapi import APIRouter, HTTPException
from database import async_session
from models import Game
from pydantic import BaseModel

router = APIRouter(tags=["games"])

class BotMatchRequest(BaseModel): #pydantic parsing method
    user_id: int

@router.post("/api/games/vs-bot/")
async def start_bot_game(request: BotMatchRequest):

    if request.user_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid User ID. React is sending 0!")
    
    async with async_session() as session:
        new_game = Game(
            white_player_id=request.user_id,
            black_player_id=None,
            status="ongoing"
        )
        
        session.add(new_game)
        await session.commit()
        await session.refresh(new_game)

        return {"game_id": new_game.id}