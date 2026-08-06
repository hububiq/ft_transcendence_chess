# fastapi_backend/tournament_progression_service.py

from sqlmodel import select
from fastapi_backend.models import Tournament, TournamentMatch, Game
from server import manager


async def advance_tournament(game_id: int, winner_id: int, session):
    """
    Called from handle_game_over() whenever a tournament game finishes.
    This function:
    - updates the TournamentMatch with the winner
    - checks if the round is complete
    - advances winners to the next round
    - creates next-round games
    - ends the tournament if final is complete
    """

    # ------------------------------------------------------------
    # 1. Load the game and its tournament match
    # ------------------------------------------------------------
    game = await session.get(Game, game_id)
    if not game or not game.tournament_id:
        return  # Not a tournament game

    tournament_id = game.tournament_id

    tm = await session.get(TournamentMatch, game.tournament_match_id)
    if not tm:
        return

    # ------------------------------------------------------------
    # 2. Update match winner
    # ------------------------------------------------------------
    tm.winner = winner_id
    session.add(tm)
    await session.commit()

    # ------------------------------------------------------------
    # 3. Check if all matches in this round are finished
    # ------------------------------------------------------------
    query = select(TournamentMatch).where(
        TournamentMatch.tournament_id == tournament_id,
        TournamentMatch.round_number == tm.round_number
    )
    round_matches = (await session.exec(query)).all()

    # If ANY match has no winner → round not finished
    if any(m.winner is None for m in round_matches):
        return

    # ------------------------------------------------------------
    # 4. Collect winners from this round
    # ------------------------------------------------------------
    winners = [m.winner for m in round_matches if m.winner is not None]

    # If only 1 winner → tournament is finished
    if len(winners) == 1:
        await _finish_tournament(tournament_id, winners[0], session)
        return

    # ------------------------------------------------------------
    # 5. Advance winners to next round
    # ------------------------------------------------------------
    next_round = tm.round_number + 1

    query = select(TournamentMatch).where(
        TournamentMatch.tournament_id == tournament_id,
        TournamentMatch.round_number == next_round
    )
    next_round_matches = (await session.exec(query)).all()

    # Fill next round matches
    idx = 0
    for match in next_round_matches:
        match.player1 = winners[idx]
        match.player2 = winners[idx + 1]
        idx += 2
        session.add(match)

    await session.commit()

    # ------------------------------------------------------------
    # 6. Create games for next round matches
    # ------------------------------------------------------------
    for match in next_round_matches:
        await _create_game_for_match(match, session)


async def _create_game_for_match(match: TournamentMatch, session):
    """
    Creates a Game row for a TournamentMatch and notifies players.
    """

    # If match is a bye (one player only)
    if match.player1 is None and match.player2 is not None:
        match.winner = match.player2
        session.add(match)
        await session.commit()
        return

    if match.player2 is None and match.player1 is not None:
        match.winner = match.player1
        session.add(match)
        await session.commit()
        return

    # If both None → ignore
    if match.player1 is None and match.player2 is None:
        return

    # Create a new Game
    new_game = Game(
        white_player_id=match.player1,
        black_player_id=match.player2,
        tournament_id=match.tournament_id,
        tournament_match_id=match.id,
        round_number=match.round_number,
        status="ongoing"
    )

    session.add(new_game)
    await session.commit()
    await session.refresh(new_game)

    match.game_id = new_game.id
    session.add(match)
    await session.commit()

    # Notify players
    for pid, color in [(match.player1, "white"), (match.player2, "black")]:
        await manager.broadcast_to_game(pid, {
            "type": "match_start",
            "game_id": new_game.id,
            "color": color
        })


async def _finish_tournament(tournament_id: int, winner_id: int, session):
    """
    Marks tournament as finished and notifies the winner.
    """

    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        return

    tournament.status = "finished"
    tournament.winner_id = winner_id

    session.add(tournament)
    await session.commit()

    # Notify winner
    await manager.broadcast_to_game(winner_id, {
        "type": "tournament_won",
        "tournament_id": tournament_id
    })

