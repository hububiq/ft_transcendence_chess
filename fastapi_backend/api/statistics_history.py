from typing import Literal

from fastapi import APIRouter, Depends
from sqlmodel import col, select

from api.history_schemas import MatchHistoryItem
from auth import get_current_user
from database import async_session
from models import Game, TournamentMatch


router = APIRouter(
    prefix="/api/statistics/history",
    tags=["statistics"],
)


def _get_result(
    game: Game,
    user_id: int,
) -> Literal["win", "loss", "draw"]:
    """Resolve the completed game result for the authenticated user"""

    if game.is_draw:
        return "draw"

    if game.winner_id == user_id:
        return "win"

    return "loss"


def _get_opponent_id(
    game: Game,
    user_id: int,
) -> int | None:
    """Resolve the opponent ID while keeping bot games explicit"""

    # Bot games do not have a second human player
    if game.black_player_id is None:
        return None

    if game.white_player_id == user_id:
        return game.black_player_id

    return game.white_player_id


async def _load_tournament_rounds(
    session,
    games: list[Game],
) -> dict[int, int]:
    """Load tournament round metadata for all history games in one query"""

    match_ids = {
        game.tournament_match_id
        for game in games
        if game.tournament_match_id is not None
    }

    if not match_ids:
        return {}

    # Load all required tournament matches together to avoid one query per game
    result = await session.execute(
        select(TournamentMatch).where(
            col(TournamentMatch.id).in_(
                match_ids
            )
        )
    )

    matches = result.scalars().all()

    return {
        match.id: match.round_number
        for match in matches
        if match.id is not None
    }


def _build_history_item(
    game: Game,
    user_id: int,
    tournament_rounds: dict[int, int],
) -> MatchHistoryItem:
    """Build one statistics history item without exposing raw game state"""

    tournament_round = None

    if game.tournament_match_id is not None:
        tournament_round = (
            tournament_rounds.get(
                game.tournament_match_id
            )
        )

    return MatchHistoryItem(
        game_id=game.id,
        opponent_id=_get_opponent_id(
            game,
            user_id,
        ),
        is_bot=game.black_player_id is None,
        result=_get_result(
            game,
            user_id,
        ),
        played_at=game.played_at,
        tournament_id=game.tournament_id,
        tournament_round=tournament_round,
    )


@router.get(
    "/me/",
    response_model=list[MatchHistoryItem],
)
async def get_statistics_history(
    user=Depends(get_current_user),
):
    """Return completed games belonging to the authenticated user"""

    async with async_session() as session:
        # Authentication decides which user's history can be queried
        result = await session.execute(
            select(Game)
            .where(
                (
                    (Game.white_player_id == user.id)
                    | (Game.black_player_id == user.id)
                ),
                Game.status == "completed",
            )
            .order_by(
                Game.played_at.desc()
            )
        )

        games = list(
            result.scalars().all()
        )

        tournament_rounds = (
            await _load_tournament_rounds(
                session,
                games,
            )
        )

        return [
            _build_history_item(
                game,
                user.id,
                tournament_rounds,
            )
            for game in games
        ]