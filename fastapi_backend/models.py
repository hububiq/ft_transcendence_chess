from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

# ---------------------------------------------------------
# 1. TOURNAMENTS
# ---------------------------------------------------------
class Tournament(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    creator_id: int
    status: str = Field(default="waiting")  # waiting, ongoing, completed
    winner_id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------
# 2. TOURNAMENT PARTICIPANTS
# ---------------------------------------------------------
class TournamentParticipant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    tournament_id: int = Field(foreign_key="tournament.id")
    player_id: int
    bracket_position: int  # Used for bracket generation


# ---------------------------------------------------------
# 3. GAMES (Tournament + Local 1v1)
# ---------------------------------------------------------
class Game(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    white_player_id: int
    black_player_id: Optional[int] = None

    tournament_id: Optional[int] = Field(default=None, foreign_key="tournament.id")

    # REQUIRED FOR ROUND ADVANCEMENT
    round_number: int = Field(default=1)

    is_local_1v1: bool = Field(default=False)

    status: str = Field(default="ongoing")  # ongoing, completed
    winner_id: Optional[int] = None

    moves_pgn: str = Field(default="")
    played_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------
# 4. GAME INVITATIONS
# ---------------------------------------------------------
class GameInvitation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    sender_id: int
    receiver_id: int

    status: str = Field(default="pending")  # pending, accepted, declined
    is_recommendation: bool = Field(default=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    moves_pgn: str = Field(default="")
