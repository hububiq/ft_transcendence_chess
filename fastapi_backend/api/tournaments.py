from fastapi import APIRouter, HTTPException
from sqlmodel import select
from database import async_session

from models import (
    Tournament,
    TournamentParticipant,
    TournamentMatch,
    Game
)

from bracket_service import generate_bracket
from bracket_importer import import_bracket

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])


# ------------------------------------------------------------
# LIST ALL TOURNAMENTS
# ------------------------------------------------------------
@router.get("/")
async def list_tournaments():
    async with async_session() as session:
        result = await session.execute(select(Tournament))
        return result.scalars().all()


# ------------------------------------------------------------
# GET FULL TOURNAMENT STATE
# ------------------------------------------------------------
@router.get("/{tournament_id}/")
async def get_tournament(tournament_id: int):
    async with async_session() as session:

        tournament = await session.get(Tournament, tournament_id)
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")

        participants = await session.execute(
            select(TournamentParticipant).where(
                TournamentParticipant.tournament_id == tournament_id
            )
        )

        matches = await session.execute(
            select(TournamentMatch).where(
                TournamentMatch.tournament_id == tournament_id
            )
        )

        games = await session.execute(
            select(Game).where(Game.tournament_id == tournament_id)
        )

        return {
            "tournament": tournament,
            "participants": participants.scalars().all(),
            "matches": matches.scalars().all(),
            "games": games.scalars().all(),
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

        result = await session.execute(
            select(TournamentParticipant).where(
                TournamentParticipant.tournament_id == tournament_id
                )
        )
        participants_list = result.scalars().all()

        if len(participants_list) >= tournament.size:
            raise HTTPException(status_code=400, detail="Tournament is full")

        bracket_position = len(participants.scalars().all()) + 1

        tp = TournamentParticipant(
            tournament_id=tournament_id,
            player_id=player_id,
            bracket_position=bracket_position
        )
        session.add(tp)
        await session.commit()

        # Auto-start when minimum 4 players joined
        if len(participants_list) + 1 >= 4:
            await _start_tournament(tournament, session)

        return {"joined": True, "position": bracket_position}


# ------------------------------------------------------------
# GET PLAYER'S ACTIVE TOURNAMENT
# ------------------------------------------------------------
@router.get("/player/{player_id}")
async def get_player_tournament(player_id: int):
    async with async_session() as session:
        result = await session.execute(
            select(TournamentParticipant).where(
                TournamentParticipant.player_id == player_id
            )
        )
        tp = result.scalars.first()
        if not tp:
            return {"active": False}

        tournament = await session.get(Tournament, tp.tournament_id)
        return {
            "active": True,
            "tournament": tournament
        }


# ------------------------------------------------------------
# GET NEXT MATCH FOR PLAYER
# ------------------------------------------------------------
@router.get("/{tournament_id}/next/{player_id}")
async def get_next_match(tournament_id: int, player_id: int):
    async with async_session() as session:
        result = await session.execute(
            select(TournamentMatch).where(
                TournamentMatch.tournament_id == tournament_id,
                (TournamentMatch.player1 == player_id) |
                (TournamentMatch.player2 == player_id)
            )
        )
        matches = result.scalars.all()

        for m in matches:
            if m.winner is None:
                return {"match": m}

        return {"match": None}


# ------------------------------------------------------------
# GET BRACKET STRUCTURE
# ------------------------------------------------------------
@router.get("/{tournament_id}/bracket")
async def get_bracket(tournament_id: int):
    async with async_session() as session:
        result = await session.execute(
            select(TournamentMatch).where(
                TournamentMatch.tournament_id == tournament_id
            )
        )
        matches = result.scalars().all()

        rounds = {}
        for m in matches:
            rounds.setdefault(m.round_number, []).append(m)

        return {"rounds": rounds}


# ------------------------------------------------------------
# GET TOURNAMENT MATCH HISTORY
# ------------------------------------------------------------
@router.get("/{tournament_id}/history")
async def get_tournament_history(tournament_id: int):
    async with async_session() as session:
        result = await session.execute(
            select(Game).where(Game.tournament_id == tournament_id)
        )
        games = result.scalars().all()
        return {"games": games}

# ------------------------------------------------------------
# INTERNAL: START TOURNAMENT
# ------------------------------------------------------------
async def _start_tournament(tournament: Tournament, session):
    tournament.status = "ongoing"
    session.add(tournament)
    await session.commit()

    # Load participants
    participants_result = await session.execute(
        select(TournamentParticipant).where(
            TournamentParticipant.tournament_id == tournament.id
        )
    )
    participants = participants_result.scalars().all()
    
    players = [p.player_id for p in participants]

    # Generate bracket (with byes)
    rounds = generate_bracket(players)

    # Import bracket into DB
    await import_bracket(tournament.id, rounds, session)

    return True

