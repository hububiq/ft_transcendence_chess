from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime


# ------------------------------------------------------------
# 1. TOURNAMENTS
# ------------------------------------------------------------
class Tournament(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    creator_id: int  # Soft link to Django User
    size: int = 8     # 4–8 players supported
    status: str = Field(default="waiting")  # waiting / ongoing / finished

    winner_id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    participants: List["TournamentParticipant"] = Relationship(back_populates="tournament")
    matches: List["TournamentMatch"] = Relationship(back_populates="tournament")


# ------------------------------------------------------------
# 2. TOURNAMENT PARTICIPANTS
# ------------------------------------------------------------
class TournamentParticipant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    tournament_id: int = Field(foreign_key="tournament.id")
    player_id: int  # Soft link to Django User or Bot

    bracket_position: int  # 1..N

    tournament: Optional[Tournament] = Relationship(back_populates="participants")


# ------------------------------------------------------------
# 3. TOURNAMENT MATCHES 
# ------------------------------------------------------------
class TournamentMatch(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    tournament_id: int = Field(foreign_key="tournament.id")
    round_number: int  # 1 = quarterfinals, 2 = semifinals, 3 = final

    # Player slots (None = bye)
    player1: Optional[int] = Field(default=None) 
    player2: Optional[int] = Field(default=None) 

    # Result
    winner: Optional[int] = Field(default=None)
    game_id: Optional[int] = Field(default=None, foreign_key="game.id")

    tournament: Optional[Tournament] = Relationship(back_populates="matches")


# ------------------------------------------------------------
# 4. GAMES (Updated with Tournament + Draw Support)
# ------------------------------------------------------------
class Game(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    white_player_id: int
    black_player_id: Optional[int] = None

    tournament_id: Optional[int] = Field(default=None, foreign_key="tournament.id")
    tournament_match_id: Optional[int] = Field(default=None, foreign_key="tournamentmatch.id")

    is_local_1v1: bool = Field(default=False)

    status: str = Field(default="ongoing")  # ongoing / finished / aborted
    winner_id: Optional[int] = None
    is_draw: bool = False

    moves_pgn: str = Field(default="")
    played_at: datetime = Field(default_factory=datetime.utcnow)


# ------------------------------------------------------------
# 5. GAME INVITATIONS (unchanged)
# ------------------------------------------------------------
class GameInvitation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    sender_id: int
    receiver_id: int

    status: str = Field(default="pending")  # pending, accepted, declined
    is_recommendation: bool = Field(default=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)

