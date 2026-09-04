from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class MatchHistoryItem(BaseModel):
    """Represent one completed game from the current user's perspective"""

    game_id: int
    opponent_id: int | None
    is_bot: bool
    result: Literal["win", "loss", "draw"]
    played_at: datetime
    tournament_id: int | None
    tournament_round: int | None