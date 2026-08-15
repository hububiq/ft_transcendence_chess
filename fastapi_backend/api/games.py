from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_
from sqlmodel import select

from auth import UserInfo, get_current_user
from database import async_session
from models import Game

router = APIRouter(tags=["games"])

class BotMatchRequest(BaseModel): #pydantic parsing method
    user_id: int

class ActiveGameResponse(BaseModel):
    game_id: int
    color: Literal["white", "black"]
    opponent_id: int

@router.get(
    "/api/games/active/",
    response_model=ActiveGameResponse | None,
)
async def get_active_game(
    current_user: UserInfo = Depends(get_current_user),
):
    async with async_session() as session:
        # Find the newest ongoing multiplayer game for the authenticated user
        query = (
            select(Game)
            .where(
                Game.status == "ongoing",
                Game.black_player_id.is_not(None),
                or_(
                    Game.white_player_id == current_user.id,
                    Game.black_player_id == current_user.id,
                ),
            )
            .order_by(Game.played_at.desc())
            .limit(1)
        )

        result = await session.execute(query)
        game = result.scalars().first()

        if game is None:
            return None

        if game.white_player_id == current_user.id:
            return ActiveGameResponse(
                game_id=game.id,
                color="white",
                opponent_id=game.black_player_id,
            )

        return ActiveGameResponse(
            game_id=game.id,
            color="black",
            opponent_id=game.white_player_id,
        )

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