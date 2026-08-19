from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from database import async_session
from auth import get_current_user
from tournament_progression_service import _create_game_for_match
from server import manager

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
        raise HTTPException(
            status_code=400, detail="Tournament size must be 4–8 players.")

    async with async_session() as session:
        tournament = Tournament(
            creator_id=creator_id,
            size=size,
            status="waiting"
        )
        session.add(tournament)
        await session.commit()
        await session.refresh(tournament)

        await manager.broadcast_to_all({
            "type": "tournament_updated"
        })

        return {"id": tournament.id, "status": "waiting"}


# ------------------------------------------------------------
# DELETE TOURNAMENT
# ------------------------------------------------------------
@router.delete("/{tournament_id}/delete")
async def delete_tournament(tournament_id: int, user = Depends(get_current_user)): # This automatically decodes the JWT and gets the secure ID!
    async with async_session() as session:
        # 1. Find the tournament in the database
        tournament = await session.get(Tournament, tournament_id)
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")

        # 2. SECURITY CHECK: Is the person clicking the button the actual creator?
        if tournament.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Forbidden: You are not the creator of this tournament!")
        
        # 3. Clean up the database (Delete Participants & Matches first to prevent SQL Foreign Key crashes)
        participants_res = await session.execute(select(TournamentParticipant).where(TournamentParticipant.tournament_id == tournament_id))
        for p in participants_res.scalars().all():
            await session.delete(p)

        matches_res = await session.execute(select(TournamentMatch).where(TournamentMatch.tournament_id == tournament_id))
        for m in matches_res.scalars().all():
            await session.delete(m)

        # 4. Delete the Tournament itself
        await session.delete(tournament)
        await session.commit()

        await manager.broadcast_to_all({
            "type": "tournament_updated"
        })

        return {"message": f"Tournament {tournament_id} has been securely deleted."}

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
            raise HTTPException(
                status_code=400, detail="Tournament already started")

        result = await session.execute(
            select(TournamentParticipant).where(
                TournamentParticipant.tournament_id == tournament_id
            )
        )
        participants_list = result.scalars().all()

        if len(participants_list) >= tournament.size:
            raise HTTPException(status_code=400, detail="Tournament is full")

        bracket_position = len(participants_list) + 1

        tp = TournamentParticipant(
            tournament_id=tournament_id,
            player_id=player_id,
            bracket_position=bracket_position
        )
        session.add(tp)
        await session.commit()

        if len(participants_list) + 1 == tournament.size:
            await _start_tournament(tournament, session)
        
        await manager.broadcast_to_all({
            "type": "tournament_updated",
            "tournament_id": tournament_id
        })

        return {"joined": True, "position": bracket_position}


# ------------------------------------------------------------
# LEAVE TOURNAMENT LOBBY
# ------------------------------------------------------------
@router.delete("/{tournament_id}/leave")
async def leave_tournament(tournament_id: int, user = Depends(get_current_user)):
    async with async_session() as session:
        # 1. Ensure the tournament exists and hasn't started yet
        tournament = await session.get(Tournament, tournament_id)
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        if tournament.status != "waiting":
            raise HTTPException(status_code=400, detail="Cannot leave a tournament that already started!")

        # 2. Find the participant row
        query = select(TournamentParticipant).where(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.player_id == user.id
        )
        participant = (await session.execute(query)).scalars().first()

        if not participant:
            raise HTTPException(status_code=400, detail="You are not in this tournament.")

        # 3. Delete the participant from the database
        await session.delete(participant)
        await session.commit()

        await manager.broadcast_to_all({
            "type": "tournament_updated",
            "tournament_id": tournament_id
        })

        return {"message": "Successfully left the tournament."}


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
        participants = result.scalars().all()

        for tp in participants:
            tournament = await session.get(Tournament, tp.tournament_id)

        if tournament and tournament.status in ["waiting", "ongoing"]:
            return {
                "active": True,
                "tournament": tournament
            }

        return {"active": False}

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
        matches = result.scalars().all()

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

    # Find all matches for Round 1 in the database
    matches_result = await session.execute(
        select(TournamentMatch).where(
            TournamentMatch.tournament_id == tournament.id,
            TournamentMatch.round_number == 1
        )
    )
    round_1_matches = matches_result.scalars().all()

    # Create the actual Game rows and notify the WebSockets
    for match in round_1_matches:
        # This function (from progression service) creates the game AND sends the "match_start" WebSocket alert
        await _create_game_for_match(match, session) 

    return True


# ------------------------------------------------------------
# MANUAL START TOURNAMENT (Creator Only)
# ------------------------------------------------------------
@router.post("/{tournament_id}/start")
async def manual_start_tournament(
    tournament_id: int, 
    user = Depends(get_current_user) # Bouncer: Identifies who clicked the button
):
    async with async_session() as session:
        tournament = await session.get(Tournament, tournament_id)
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        if tournament.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Forbidden: Only the tournament creator can start it early.")
        if tournament.status != "waiting":
            raise HTTPException(status_code=400, detail="Tournament has already started or finished.")
        # Check if there are enough players (Minimum 4)
        result = await session.execute(
            select(TournamentParticipant).where(TournamentParticipant.tournament_id == tournament_id)
        )
        participants_list = result.scalars().all()

        if len(participants_list) < 4:
            raise HTTPException(status_code=400, detail=f"Cannot start yet. Minimum 4 players required. Currently have {len(participants_list)}.")

        await _start_tournament(tournament, session)

        return {"message": "Tournament started successfully!"}