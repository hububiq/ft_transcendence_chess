from fastapi import APIRouter, HTTPException
from sqlmodel import select
from database import async_session
from models import Tournament, TournamentParticipant, Game
import httpx

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])


# ---------------------------------------------------------
# 1. LIST ALL TOURNAMENTS
# ---------------------------------------------------------
@router.get("/")
async def list_tournaments():
    async with async_session() as session:
        result = await session.execute(select(Tournament))
        return result.scalars().all()


# ---------------------------------------------------------
# 2. GET SINGLE TOURNAMENT (Bracket + Games)
# ---------------------------------------------------------
@router.get("/{tournament_id}/")
async def get_tournament(tournament_id: int):
    async with async_session() as session:

        tournament = await session.get(Tournament, tournament_id)
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")

        participants = await session.execute(
            select(TournamentParticipant).where(
                TournamentParticipant.tournament_id == tournament_id
            )
        )

        games = await session.execute(
            select(Game).where(Game.tournament_id == tournament_id)
        )

        return {
            "tournament": tournament,
            "participants": participants.scalars().all(),
            "games": games.scalars().all(),
        }


# ---------------------------------------------------------
# 3. FETCH ELO FROM DJANGO
# ---------------------------------------------------------
async def fetch_player_elo(player_id: int) -> int:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"http://django_backend:8000/api/users/{player_id}/elo/",
            headers={"Host": "localhost"}
        )
        data = resp.json()
        return data.get("elo", 1200)  # fallback


# ---------------------------------------------------------
# 4. ELO-BASED SEEDING (Snake Seeding)
# ---------------------------------------------------------
async def elo_based_seeding(player_ids: list[int]) -> list[dict]:
    players = []
    for pid in player_ids:
        elo = await fetch_player_elo(pid)
        players.append({"player_id": pid, "elo": elo})

    # Sort strongest → weakest
    players.sort(key=lambda p: p["elo"], reverse=True)

    bracket = []
    left = 0
    right = len(players) - 1
    position = 1

    while left <= right:
        bracket.append({
            "player_id": players[left]["player_id"],
            "bracket_position": position
        })
        position += 1

        if left != right:
            bracket.append({
                "player_id": players[right]["player_id"],
                "bracket_position": position
            })
            position += 1

        left += 1
        right -= 1

    return bracket


# ---------------------------------------------------------
# 5. CREATE ROUND 1 GAMES
# ---------------------------------------------------------
async def create_round_one_games(tournament_id: int, bracket: list[dict]):
    async with async_session() as session:
        games = []

        sorted_bracket = sorted(bracket, key=lambda x: x["bracket_position"])

        for i in range(0, len(sorted_bracket), 2):
            p1 = sorted_bracket[i]["player_id"]
            p2 = sorted_bracket[i + 1]["player_id"]

            game = Game(
                tournament_id=tournament_id,
                white_player_id=p1,
                black_player_id=p2,
                round_number=1,
                status="ongoing"
            )
            session.add(game)
            games.append(game)

        await session.commit()
        return games
