from fastapi import APIRouter, HTTPException
from sqlmodel import select
from database import async_session
from models import Tournament, TournamentParticipant, Game
import httpx

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])

@router.get("/")
async def list_tournaments():
    async with async_session() as session:
        result = await session.execute(select(Tournament))
        return result.scalars().all()

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


# ---------------------------------------------------------
# 6. ADMIN: CREATE TOURNAMENT
# ---------------------------------------------------------
@router.post("/create")
async def create_tournament(payload: dict):
    """
    Admin-only endpoint.
    Creates a tournament, seeds players by ELO,
    generates bracket, and creates Round 1 games.
    """

    creator_id = payload.get("creator_id")
    player_ids = payload.get("player_ids")

    if not creator_id or not player_ids or len(player_ids) < 2:
        raise HTTPException(status_code=400, detail="Invalid tournament data")

    # 1. Create tournament
    async with async_session() as session:
        tournament = Tournament(creator_id=creator_id, status="ongoing")
        session.add(tournament)
        await session.commit()
        await session.refresh(tournament)

    # 2. Seed players using ELO
    bracket = await elo_based_seeding(player_ids)

    # 3. Insert TournamentParticipants
    async with async_session() as session:
        for entry in bracket:
            tp = TournamentParticipant(
                tournament_id=tournament.id,
                player_id=entry["player_id"],
                bracket_position=entry["bracket_position"]
            )
            session.add(tp)
        await session.commit()

    # 4. Create Round 1 games
    games = await create_round_one_games(tournament.id, bracket)

    # 5. Return full tournament structure
    return {
        "tournament_id": tournament.id,
        "status": "ongoing",
        "participants": bracket,
        "round_1_games": [
            {
                "game_id": g.id,
                "white_player_id": g.white_player_id,
                "black_player_id": g.black_player_id,
                "round_number": g.round_number
            }
            for g in games
        ]
    }