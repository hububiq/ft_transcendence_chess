from sqlmodel import select
from models import Tournament, TournamentMatch, Game
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

    # 1. Load the game and its tournament match
    game = await session.get(Game, game_id)
    if not game or not game.tournament_id:
        return  # Not a tournament game

    tournament_id = game.tournament_id

    tm = await session.get(TournamentMatch, game.tournament_match_id)
    if not tm:
        return

    # 2. Update match winner
    tm.winner = winner_id
    session.add(tm)
    await session.commit()

    # 3. Check if all matches in this round are finished
    result = await session.execute(
        select(TournamentMatch).where(
            TournamentMatch.tournament_id == tournament_id,
            TournamentMatch.round_number == tm.round_number,
        )
    )
    round_matches = result.scalars().all()

    for m in round_matches:
        if m.winner is None and (m.player1 is not None or m.player2 is not None):
            # At least one real match in this round is still ongoing
            return

    # 4. Collect winners from this round (sorted by match id to preserve order)
    sorted_round = sorted(round_matches, key=lambda m: m.id)
    actual_winners = [m.winner for m in sorted_round if m.winner is not None]

    # 5. Determine next round
    next_round = tm.round_number + 1
    next_result = await session.execute(
        select(TournamentMatch).where(
            TournamentMatch.tournament_id == tournament_id,
            TournamentMatch.round_number == next_round,
        )
    )
    next_round_matches = next_result.scalars().all()

    # 5a. If there is NO next round and we have exactly one winner → final is done
    if not next_round_matches and len(actual_winners) == 1:
        await _finish_tournament(tournament_id, actual_winners[0], session)
        return

    # 5b. Load round 1 to detect bracket type
    r1_result = await session.execute(
        select(TournamentMatch).where(
            TournamentMatch.tournament_id == tournament_id,
            TournamentMatch.round_number == 1,
        )
    )
    r1_matches = r1_result.scalars().all()

    # Detect 5-player bracket (1 match in R1)
    is_5 = len(r1_matches) == 1

    # Detect 6-player bracket (2 matches in R1, no byes)
    is_6 = len(r1_matches) == 2 and all(
        m.player1 is not None and m.player2 is not None for m in r1_matches
    )

    # Detect 7-player bracket (4 matches in R1, exactly 1 bye)
    is_7 = (
        len(r1_matches) == 4
        and sum(1 for m in r1_matches if m.player2 is None) == 1
    )

    # --- 6-player propagation ---
    if is_6 and tm.round_number == 1 and len(next_round_matches) == 2:
        # R1 → R2: winners go to separate matches
        next_round_matches[0].player1 = actual_winners[0]
        next_round_matches[1].player1 = actual_winners[1]
        session.add(next_round_matches[0])
        session.add(next_round_matches[1])
        await session.commit()

    elif is_6 and tm.round_number == 2 and len(next_round_matches) == 1:
        # R2 → R3: final
        next_round_matches[0].player1 = actual_winners[0]
        next_round_matches[0].player2 = actual_winners[1]
        session.add(next_round_matches[0])
        await session.commit()

    # --- 7-player propagation (with correct winner ordering) ---
    elif is_7 and tm.round_number == 1 and len(next_round_matches) == 2:
        # R1 → R2:
        # winners M1,M2 → match 0
        # winner M3 → match 1 (player1), player2 already P7 from bracket
        sorted_r1 = sorted(r1_matches, key=lambda m: m.id)
        sorted_winners_r1 = [m.winner for m in sorted_r1]

        next_round_matches[0].player1 = sorted_winners_r1[0]  # winner M1
        next_round_matches[0].player2 = sorted_winners_r1[1]  # winner M2
        next_round_matches[1].player1 = sorted_winners_r1[2]  # winner M3

        session.add(next_round_matches[0])
        session.add(next_round_matches[1])
        await session.commit()

    elif is_7 and tm.round_number == 2 and len(next_round_matches) == 1:
        # R2 → R3: final
        sorted_r2 = sorted(round_matches, key=lambda m: m.id)
        sorted_winners_r2 = [m.winner for m in sorted_r2]

        next_round_matches[0].player1 = sorted_winners_r2[0]
        next_round_matches[0].player2 = sorted_winners_r2[1]

        session.add(next_round_matches[0])
        await session.commit()

    # --- 5-player propagation ---
    elif is_5 and tm.round_number == 1 and len(next_round_matches) == 2:
        # R1 → R2: winner goes to match 0 player1
        next_round_matches[0].player1 = actual_winners[0]
        session.add(next_round_matches[0])
        await session.commit()

    elif is_5 and tm.round_number == 2 and len(next_round_matches) == 1:
        # R2 → R3: final
        next_round_matches[0].player1 = actual_winners[0]
        next_round_matches[0].player2 = actual_winners[1]
        session.add(next_round_matches[0])
        await session.commit()

    else:
        # Normal balanced bracket logic (4 or 8 players)
        idx = 0
        for match in next_round_matches:
            if idx < len(actual_winners):
                match.player1 = actual_winners[idx]
            if idx + 1 < len(actual_winners):
                match.player2 = actual_winners[idx + 1]
            idx += 2
            session.add(match)
        await session.commit()

    # 6. Create games for next round matches
    for match in next_round_matches:
        await _create_game_for_match(match, session)


async def _create_game_for_match(match: TournamentMatch, session):
    """
    Creates a Game row for a TournamentMatch and notifies players.
    """

    # If match is a bye (one player only) in round 1
    if match.round_number == 1:
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

    # If one or both players missing in later rounds → wait
    if match.player1 is None or match.player2 is None:
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
        await manager.send_to_user(pid, {
            "type": "match_start",
            "game_id": new_game.id,
            "color": color,
            "round_number": match.round_number
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