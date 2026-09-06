from sqlmodel import select
from models import TournamentMatch, TournamentParticipant
from typing import List
import asyncio


async def import_bracket(tournament_id: int, rounds: List[List[dict]], session):

    # 1. Insert all matches
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

    # 2. Auto-advance BYE players in Round 1 ONLY
    result = await session.execute(
        select(TournamentMatch).where(
            TournamentMatch.tournament_id == tournament_id,
            TournamentMatch.round_number == 1
        )
    )
    round1_matches = result.scalars().all()

    for match in round1_matches:
        if match.player1 is not None and match.player2 is None:
            match.winner = match.player1
        elif match.player2 is not None and match.player1 is None:
            match.winner = match.player2
        else:
            match.winner = None

        session.add(match)

    await session.commit()

