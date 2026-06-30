from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

# ---------------------------------------------------------
# 1. TOURNAMENTS
# ---------------------------------------------------------
class Tournament(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    creator_id: int  # Soft link to Django User
    status: str = Field(default="waiting")
    winner_id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ---------------------------------------------------------
# 2. TOURNAMENT PARTICIPANTS (Junction Table)
# ---------------------------------------------------------
class TournamentParticipant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # STRICT RELATION: Forces PostgreSQL to link this to the Tournament table
    tournament_id: int = Field(foreign_key="tournament.id") 
    
    player_id: int  # Soft link to Django User (or Bot)
    bracket_position: int

# ---------------------------------------------------------
# 3. GAMES (Updated with Tournament foreign key and Local 1v1!)
# ---------------------------------------------------------
class Game(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    white_player_id: int   # Soft link
    black_player_id: Optional[int] = None 
    
    # STRICT RELATION: Links the game to a tournament (if it's a tournament match)
    tournament_id: Optional[int] = Field(default=None, foreign_key="tournament.id")
    
    is_local_1v1: bool = Field(default=False)
    
    status: str = Field(default="ongoing") 
    winner_id: Optional[int] = None
    moves_pgn: str = Field(default="")
    played_at: datetime = Field(default_factory=datetime.utcnow)

# ---------------------------------------------------------
# 4. GAME INVITATIONS (For Scikit-Learn Matchmaking & Direct Invites)
# ---------------------------------------------------------
class GameInvitation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    sender_id: int     # Soft link (User who clicked 'Invite')
    receiver_id: int   # Soft link (User receiving the invite)
    
    status: str = Field(default="pending") # pending, accepted, declined
    is_recommendation: bool = Field(default=False) # True if from Scikit-Learn!
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    moves_pgn: str = Field(default="")
    
    # Timestamp
    played_at: datetime = Field(default_factory=datetime.utcnow)
