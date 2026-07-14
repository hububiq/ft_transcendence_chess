from fastapi import APIRouter, HTTPException
from sqlmodel import select
from database import async_session
from models import Tournament, TournamentParticipant, Game

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])

@router.get("/")
async def list_tournaments():
    async with async_session() as session:
        result = await session.exec(select(Tournament))
        return result.all()

@router.get("/{tournament_id}/")
async def get_tournament(tournament_id: int):
    async with async_session() as session:

        tournament = await session.get(Tournament, tournament_id)
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")

        participants = await session.exec(
            select(TournamentParticipant).where(
                TournamentParticipant.tournament_id == tournament_id
            )
        )

        games = await session.exec(
            select(Game).where(Game.tournament_id == tournament_id)
        )

        return {
            "tournament": tournament,
            "participants": participants.all(),
            "games": games.all(),
        }
