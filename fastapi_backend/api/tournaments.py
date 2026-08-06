# fastapi_backend/api/tournaments.py

from fastapi import APIRouter, HTTPException
from sqlmodel import select
from database import async_session

from models import (
    Tournament,
    TournamentParticipant,
    TournamentMatch,
    Game
)

from fastapi_backend.bracket_service import generate_bracket
from fastapi_backend.bracket_importer import import_bracket

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])


# ------------------------------------------------------------
# LIST ALL TOURNAMENTS
# ------------------------------------------------------------
@router.get("/")
async def list_tournaments():
    async with async_session() as session:
        result = await session.exec(select(Tournament))
        return result.all()


# ------------------------------------------------------------
# GET FULL TOURNAMENT STATE
# ------------------------------------------------------------
@router.get("/{tournament_id}/")
async def get_tournament(tournament_id: int):
    async with async_session() as session:

        tournament = await session.get(Tournament, tournament_id)
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")

        participants = (await session.exec(
            select(TournamentParticipant).where(
                TournamentParticipant.tournament_id == tournament_id
            )
        )).all()

        matches = (await session.exec(
            select(TournamentMatch).where(
                TournamentMatch.tournament_id == tournament_id
            )
        )).all()

        games = (await session.exec(
            select(Game).where(Game.tournament_id == tournament_id)
        )).all()

        return {
            "tournament": tournament,
            "participants": participants,
            "matches": matches,
            "games": games,
        }


# ------------------------------------------------------------
# CREATE TOURNAMENT
# ------------------------------------------------------------
@router.post("/create")
async def create_tournament(creator_id: int, size: int = 8):
    if size not in [4, 5, 6, 7, 8]:
        raise HTTPException(status_code=400, detail="Tournament size must be 4–8 players.")

    async with async_session() as session:
        tournament = Tournament(
            creator_id=creator_id,
            size=size,
            status="waiting"
        )
        session.add(tournament)
        await session.commit()
        await session.refresh(tournament)

        return {"tournament_id": tournament.id, "status": "waiting"}


# ------------------------------------------------------------
# JOIN TOURNAMENT
# ------------------------------------------------------------
@router.post("/{tournament_id}/join")
async def join_tournament(tournament_id: int, player_id: int):
    async with async_session() as session:
        tournament = await session.get(Tournament, tournament_id)
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")

        if tournament.status != "waiting":
            raise HTTPException(status_code=400, detail="Tournament already started")

        # Count current participants
        participants = (await session.exec(
            select(TournamentParticipant).where(
                TournamentParticipant.tournament_id == tournament_id
            )
        )).all()

        if len(participants) >= tournament.size:
            raise HTTPException(status_code=400, detail="Tournament is full")

        bracket_position = len(participants) + 1

        tp = TournamentParticipant(
            tournament_id=tournament_id,
            player_id=player_id,
            bracket_position=bracket_position
        )
        session.add(tp)
        await session.commit()

        # Auto-start when minimum 4 players joined
        if len(participants) + 1 >= 4:
            await _start_tournament(tournament, session)

        return {"joined": True, "position": bracket_position}


# ------------------------------------------------------------
# INTERNAL: START TOURNAMENT
# ------------------------------------------------------------
async def _start_tournament(tournament: Tournament, session):
    tournament.status = "ongoing"
    session.add(tournament)
    await session.commit()

    # Load participants
    participants = (await session.exec(
        select(TournamentParticipant).where(
            TournamentParticipant.tournament_id == tournament.id
        )
    )).all()

    players = [p.player_id for p in participants]

    # Generate bracket (with byes)
    rounds = generate_bracket(players)

    # Import bracket into DB
    await import_bracket(tournament.id, rounds, session)

    return True

