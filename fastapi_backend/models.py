from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

# 1. THE GAMES TABLE
class Game(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Soft links to Django Users!
    white_player_id: int
    black_player_id: Optional[int] = None # Nullable for playing against AI
    
    # Game data
    status: str = Field(default="ongoing") # ongoing, completed, drawn
    winner_id: Optional[int] = None
    moves_pgn: str = Field(default="")
    
    # Timestamp
    played_at: datetime = Field(default_factory=datetime.utcnow)

# 2. THE TOURNAMENTS TABLE (Simple MVP version)
class Tournament(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    creator_id: int
    status: str = Field(default="waiting")
    winner_id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)