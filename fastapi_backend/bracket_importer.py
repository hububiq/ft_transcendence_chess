# fastapi_backend/bracket_importer.py

from sqlmodel import select
from fastapi_backend.models import TournamentMatch, TournamentParticipant
from typing import List
import asyncio


async def import_bracket(tournament_id: int, rounds: List[List[dict]], session):
    """
    Imports the generated bracket into TournamentMatch rows.

    rounds: [
        [ {"player1": id or None, "player2": id or None}, ... ],  # Round 1
        [ {"player1": None, "player2": None}, ... ],              # Round 2
        [ {"player1": None, "player2": None} ]                    # Final
    ]
    """

    # ------------------------------------------------------------
    # 1. Insert all matches into DB
    # ------------------------------------------------------------
    for round_number, matches in enumerate(rounds, start=1):
        for match in matches:
            tm = TournamentMatch(
                tournament_id=tournament_id,
                round_number=round_number,
                player1=match["player1"],
                player2=match["player2"],
                winner=None,
                game_id=None
            )
            session.add(tm)

    await session.commit()

    # ------------------------------------------------------------
    # 2. Auto-advance BYE players (player2=None or player1=None)
    # ------------------------------------------------------------
    query = select(TournamentMatch).where(
        TournamentMatch.tournament_id == tournament_id,
        TournamentMatch.round_number == 1
    )
    round1_matches = (await session.exec(query)).all()

    for match in round1_matches:
        # Case 1: player1 exists, player2 is None → player1 auto-advances
        if match.player1 is not None and match.player2 is None:
            match.winner = match.player1

        # Case 2: player2 exists, player1 is None → player2 auto-advances
        elif match.player2 is not None and match.player1 is None:
            match.winner = match.player2

        # Case 3: both None → ignore (empty slot)
        elif match.player1 is None and match.player2 is None:
            match.winner = None

        session.add(match)

    await session.commit()

    # ------------------------------------------------------------
    # 3. Fill Round 2 with winners from Round 1
    # ------------------------------------------------------------
    await _populate_next_round(tournament_id, current_round=1, session=session)

    # ------------------------------------------------------------
    # 4. Fill Final with winners from Round 2
    # ------------------------------------------------------------
    await _populate_next_round(tournament_id, current_round=2, session=session)

    await session.commit()


async def _populate_next_round(tournament_id: int, current_round: int, session):
    """
    Takes winners from current_round and fills the next round's player slots.
    """

    # Get winners from current round
    query = select(TournamentMatch).where(
        TournamentMatch.tournament_id == tournament_id,
        TournamentMatch.round_number == current_round
    )
    current_matches = (await session.exec(query)).all()

    winners = [m.winner for m in current_matches if m.winner is not None]

    # If only 1 winner → tournament ends
    if len(winners) <= 1:
        return

    # Get next round matches
    next_round = current_round + 1

    query = select(TournamentMatch).where(
        TournamentMatch.tournament_id == tournament_id,
        TournamentMatch.round_number == next_round
    )
    next_matches = (await session.exec(query)).all()

    # Fill next round matches
    idx = 0
    for match in next_matches:
        match.player1 = winners[idx]
        match.player2 = winners[idx + 1]
        idx += 2
        session.add(match)

    await session.commit()

