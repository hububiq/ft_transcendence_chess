from typing import List


def generate_bracket(players: List[int]) -> List[List[dict]]:
    """
    Generates a tournament bracket for 4–8 players.
    Special cases:
      - 5 players: 1 match, 2 matches, final
      - 6 players: 2 matches, 2 matches, final
      - 7 players: 3 matches + bye, 2 matches, final
    """

    n = len(players)
    if n < 4 or n > 8:
        raise ValueError("Tournament size must be between 4 and 8 players.")

    # 5-player
    if n == 5:
        p = players
        round1 = [
            {"player1": p[0], "player2": p[1]},
        ]
        round2 = [
            {"player1": None, "player2": p[2]},
            {"player1": p[3], "player2": p[4]},
        ]
        round3 = [
            {"player1": None, "player2": None},
        ]
        return [round1, round2, round3]

    # 6-player
    if n == 6:
        p = players
        round1 = [
            {"player1": p[0], "player2": p[1]},
            {"player1": p[2], "player2": p[3]},
        ]
        round2 = [
            {"player1": None, "player2": p[4]},
            {"player1": None, "player2": p[5]},
        ]
        round3 = [
            {"player1": None, "player2": None},
        ]
        return [round1, round2, round3]

    # 7-player
    if n == 7:
        p = players
        round1 = [
            {"player1": p[0], "player2": p[1]},  # M1
            {"player1": p[2], "player2": p[3]},  # M2
            {"player1": p[4], "player2": p[5]},  # M3
            {"player1": p[6], "player2": None},  # M4 (bye)
        ]
        round2 = [
            {"player1": None, "player2": None},  # winners M1,M2
            {"player1": None, "player2": p[6]},  # winner M3 vs P7
        ]
        round3 = [
            {"player1": None, "player2": None},
        ]
        return [round1, round2, round3]

    # 4 or 8 players: standard knockout
    bracket_size = 4 if n == 4 else 8
    padded = players + [None] * (bracket_size - n)

    round1 = []
    for i in range(0, bracket_size, 2):
        round1.append({"player1": padded[i], "player2": padded[i + 1]})

    rounds = [round1]
    remaining = bracket_size // 2
    while remaining >= 2:
        rounds.append(
            [{"player1": None, "player2": None} for _ in range(remaining // 2)]
        )
        remaining //= 2

    return rounds