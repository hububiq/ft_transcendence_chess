import { api } from "../../api/axios";
import type {
  LeaderboardPlayer,
  LeaderboardResponse,
} from "./types";


function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


function isNonNegativeInteger(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0
  );
}


function parseLeaderboardPlayer(
  value: unknown,
): LeaderboardPlayer | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNonNegativeInteger(value.rank) ||
    value.rank < 1 ||
    !isNonNegativeInteger(value.user_id) ||
    value.user_id < 1 ||
    typeof value.username !== "string" ||
    value.username.trim().length === 0 ||
    typeof value.elo_rating !== "number" ||
    !Number.isFinite(value.elo_rating) ||
    !isNonNegativeInteger(
      value.total_games,
    ) ||
    !isNonNegativeInteger(value.wins) ||
    typeof value.win_rate !== "number" ||
    !Number.isFinite(value.win_rate) ||
    value.win_rate < 0 ||
    value.win_rate > 100 ||
    typeof value.is_current_user !==
      "boolean"
  ) {
    return null;
  }

  return {
    rank: value.rank,
    user_id: value.user_id,
    username: value.username,
    elo_rating: value.elo_rating,
    total_games: value.total_games,
    wins: value.wins,
    win_rate: value.win_rate,
    is_current_user:
      value.is_current_user,
  };
}


function parseLeaderboardResponse(
  value: unknown,
): LeaderboardResponse {
  if (
    !isRecord(value) ||
    !Array.isArray(value.top_players)
  ) {
    throw new Error(
      "Invalid leaderboard response",
    );
  }

  const topPlayers =
    value.top_players.map(
      parseLeaderboardPlayer,
    );

  if (
    topPlayers.some(
      (player) => player === null,
    )
  ) {
    throw new Error(
      "Invalid leaderboard player",
    );
  }

  let currentUser:
    LeaderboardPlayer | null = null;

  if (value.current_user !== null) {
    currentUser =
      parseLeaderboardPlayer(
        value.current_user,
      );

    if (currentUser === null) {
      throw new Error(
        "Invalid current leaderboard user",
      );
    }
  }

  return {
    top_players:
      topPlayers as LeaderboardPlayer[],
    current_user: currentUser,
  };
}


export async function fetchLeaderboard(
  signal?: AbortSignal,
): Promise<LeaderboardResponse> {
  const response = await api.get<unknown>(
    "/api/leaderboard/",
    {
      signal,
    },
  );

  return parseLeaderboardResponse(
    response.data,
  );
}