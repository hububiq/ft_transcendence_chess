from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response

from .models import User


LEADERBOARD_SIZE = 10


def _calculate_win_rate(
    wins: int,
    total_games: int,
) -> float:
    """Calculate the completed win percentage for one player"""

    if total_games <= 0:
        return 0.0

    return round(
        (wins / total_games) * 100,
        1,
    )


def _build_leaderboard_entry(
    user: User,
    rank: int,
    current_user_id: int,
) -> dict:
    """Build one public leaderboard entry from existing profile statistics"""

    profile = user.profile

    return {
        "rank": rank,
        "user_id": user.id,
        "username": user.username,
        "elo_rating": profile.elo_rating,
        "total_games": profile.total_games,
        "wins": profile.wins,
        "win_rate": _calculate_win_rate(
            profile.wins,
            profile.total_games,
        ),
        "is_current_user":
            user.id == current_user_id,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_leaderboard(request):
    """Return the top players and the authenticated user's position"""

    # Keep bots outside the human competitive ranking
    ranked_users = list(
        User.objects.filter(
            is_bot=False,
        )
        .select_related("profile")
        .order_by(
            "-profile__elo_rating",
            "id",
        )
    )

    entries = [
        _build_leaderboard_entry(
            user,
            rank,
            request.user.id,
        )
        for rank, user in enumerate(
            ranked_users,
            start=1,
        )
    ]

    current_user = next(
        (
            entry
            for entry in entries
            if entry["user_id"]
            == request.user.id
        ),
        None,
    )

    return Response(
        {
            "top_players":
                entries[:LEADERBOARD_SIZE],
            "current_user":
                current_user,
        }
    )