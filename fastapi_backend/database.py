from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from config import settings

# SQLAlchemy async requires a specific URL prefix.
# We change "postgres://" from your .env file to "postgresql+asyncpg://"
async_db_url = settings.database_url.replace("postgres://", "postgresql+asyncpg://")

# Create the Engine (The connection to the database)
# echo=True means it will print the raw SQL it generates to the terminal
engine = create_async_engine(async_db_url, echo=True)

# The function to automatically build the tables
async def init_db():
    async with engine.begin() as conn:
        # This tells PostgreSQL: "Look at models.py and create any tables that don't exist yet"
        await conn.run_sync(SQLModel.metadata.create_all)