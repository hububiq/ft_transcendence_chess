from fastapi import APIRouter, Depends
from sqlmodel import select
from db import async_session
from models import Game
from auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])

@router.get("/me/")
async def get_my_history(user=Depends(get_current_user)):
    async with async_session() as session:
        query = select(Game).where(
            (Game.white_player_id == user.id) |
            (Game.black_player_id == user.id)
        )
        result = await session.exec(query)
        return result.all()
