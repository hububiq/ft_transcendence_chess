# fastapi_backend/game_service.py

import json
import chess
import chess.pgn
import httpx
from sqlmodel import select

from redis_client import get_redis
from ai_engine import compute_best_move
from database import async_session
from models import Game, Tournament


# ---------------------------------------------------------
# 1. PLAYER MOVE HANDLER
# ---------------------------------------------------------
async def handle_player_move(data: dict, game_id: str, websocket):
    """
    Handles a player's move:
    - Validates and applies move
    - Stores FEN + move list in Redis
    - Triggers AI move if vs bot
    - Detects game over and calls handle_game_over
    """

    redis = await get_redis()
    redis_key = f"game:{game_id}:fen"

    current_fen = await redis.get(redis_key)
    board = chess.Board(current_fen) if current_fen else chess.Board()

    try:
        move = chess.Move.from_uci(data["move"])
    except ValueError:
        await websocket.send_json({"type": "error", "message": "Invalid move format!"})
        return

    if move not in board.legal_moves:
        await websocket.send_json({"type": "error", "message": "Illegal move"})
        return

    # Apply human move
    board.push(move)
    await redis.set(redis_key, board.fen())
    await redis.rpush(f"game:{game_id}:moves", move.uci())

    await websocket.send_json({
        "type": "move",
        "move": move.uci(),
        "fen": board.fen()
    })

    # Check if game ended after human move
    if board.is_game_over():
        actual_winner = data["player_id"] if board.is_checkmate() else None
        actual_loser = data["opponent_id"] if board.is_checkmate() else None
        await handle_game_over(
            board,
            game_id,
            winner_id=actual_winner,
            loser_id=actual_loser,
            websocket=websocket
        )
        return

    # Bot move (vs AI)
    if data.get("is_vs_bot") is True:
        await websocket.send_json({"type": "info", "message": "Bot is thinking..."})
        safe_depth = 4
        ai_uci = compute_best_move(board.fen(), depth=safe_depth)

        if ai_uci:
            ai_move = chess.Move.from_uci(ai_uci)
            if ai_move in board.legal_moves:
                board.push(ai_move)
                await redis.set(redis_key, board.fen())
                await redis.rpush(f"game:{game_id}:moves", ai_uci)

                await websocket.send_json({
                    "type": "move",
                    "move": ai_uci,
                    "fen": board.fen()
                })

                if board.is_game_over():
                    actual_winner = data["player_id"] if board.is_checkmate() else None
                    actual_loser = data["opponent_id"] if board.is_checkmate() else None
                    await handle_game_over(
                        board,
                        game_id,
                        winner_id=actual_winner,
                        loser_id=actual_loser,
                        websocket=websocket
                    )
                    return


# ---------------------------------------------------------
# 2. GAME OVER HANDLER
# ---------------------------------------------------------
async def handle_game_over(board: chess.Board, game_id: str, winner_id: int, loser_id: int, websocket):
    """
    Generates PGN, cleans Redis, saves to PostgreSQL,
    updates ELO in Django, and triggers tournament advancement.
    """

    redis = await get_redis()

    # Rebuild PGN from stored moves
    moves_list = await redis.lrange(f"game:{game_id}:moves", 0, -1)
    replay_board = chess.Board()
    for move_uci in moves_list:
        replay_board.push(chess.Move.from_uci(move_uci.decode() if isinstance(move_uci, bytes) else move_uci))

    game_pgn = chess.pgn.Game.from_board(replay_board)
    pgn_string = str(game_pgn)

    await websocket.send_json({
        "type": "game_over",
        "winner_id": winner_id,
        "pgn": pgn_string
    })

    # Cleanup Redis
    await redis.delete(f"game:{game_id}:fen")
    await redis.delete(f"game:{game_id}:moves")

    # Save to PostgreSQL
    async with async_session() as session:
        game = await session.get(Game, int(game_id))
        if game:
            game.moves_pgn = pgn_string
            game.winner_id = winner_id
            game.status = "completed"
            session.add(game)
            await session.commit()
            print(f"[DB] Game {game_id} permanently saved to PostgreSQL")

            # If tournament game → publish event for advancement
            if game.tournament_id:
                await redis.publish(
                    "tournament.match.completed",
                    json.dumps({
                        "tournament_id": game.tournament_id,
                        "round_number": game.round_number
                    })
                )

    # Update ELO in Django
    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                "http://django_backend:8000/api/update-elo/",
                json={"winner_id": winner_id, "loser_id": loser_id},
                headers={"Host": "localhost"}
            )
            print(f"[GAME OVER] ELO updated for Game {game_id}")
        except Exception as e:
            print(f"[ERROR] Failed to reach Django: {e}")


# ---------------------------------------------------------
# 3. TOURNAMENT ROUND ADVANCEMENT
# ---------------------------------------------------------
async def get_round_games(tournament_id: int, round_number: int):
    async with async_session() as session:
        result = await session.exec(
            select(Game).where(
                Game.tournament_id == tournament_id,
                Game.round_number == round_number
            )
        )
        return result.all()


def round_is_complete(games):
    return all(g.status == "completed" for g in games)


def extract_winners(games):
    return [g.winner_id for g in games]


def pair_winners(winners):
    return [(winners[i], winners[i + 1]) for i in range(0, len(winners), 2)]


async def create_next_round_games(tournament_id: int, round_number: int, pairs):
    async with async_session() as session:
        for white, black in pairs:
            new_game = Game(
                tournament_id=tournament_id,
                white_player_id=white,
                black_player_id=black,
                round_number=round_number + 1,
                status="ongoing"
            )
            session.add(new_game)

        await session.commit()


async def advance_tournament_round(tournament_id: int, round_number: int):
    """
    Called when all games in a round are completed.
    Decides whether to create next round or finish tournament.
    """

    games = await get_round_games(tournament_id, round_number)

    if not round_is_complete(games):
        return {"status": "waiting"}

    winners = extract_winners(games)

    # Tournament finished
    if len(winners) == 1:
        async with async_session() as session:
            tournament = await session.get(Tournament, tournament_id)
            if tournament:
                tournament.status = "completed"
                tournament.winner_id = winners[0]
                await session.commit()

        return {"status": "completed", "winner": winners[0]}

    # Create next round
    pairs = pair_winners(winners)
    await create_next_round_games(tournament_id, round_number, pairs)

    return {"status": "advanced", "next_round": round_number + 1}
