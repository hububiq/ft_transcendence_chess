from typing import List, Optional


def generate_bracket(players: List[int]) -> List[List[dict]]:
    """
    Generates a tournament bracket for 4–8 players.
    Supports automatic bye assignment.

    players: list of player_ids in random or seeding order.
    Returns:
        rounds = [
            [ {"player1": id or None, "player2": id or None}, ... ],  # Round 1
            [ {"player1": None, "player2": None}, ... ],              # Round 2
            [ {"player1": None, "player2": None} ]                    # Final
        ]
    """

    n = len(players)

    if n < 4 or n > 8:
        raise ValueError("Tournament size must be between 4 and 8 players.")

    # ------------------------------------------------------------
    # 1. Determine bracket size (power of 2)
    # ------------------------------------------------------------
    if n <= 4:
        bracket_size = 4
    else:
        bracket_size = 8

    # Fill missing slots with None (bye)
    padded_players = players + [None] * (bracket_size - n)

    # ------------------------------------------------------------
    # 2. Round 1 pairings (seeded or shuffled externally)
    # ------------------------------------------------------------
    round1 = []
    for i in range(0, bracket_size, 2):
        p1 = padded_players[i]
        p2 = padded_players[i + 1]
        round1.append({"player1": p1, "player2": p2})

    rounds = [round1]

    # ------------------------------------------------------------
    # 3. Generate empty next rounds
    # ------------------------------------------------------------
    remaining = bracket_size // 2
    while remaining >= 2:
        next_round = [
            {"player1": None, "player2": None}
            for _ in range(remaining // 2)
        ]
        rounds.append(next_round)
        remaining //= 2

    return rounds

