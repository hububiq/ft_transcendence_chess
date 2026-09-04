import { api } from "../../api/axios";
import type {
  MatchHistoryApiItem,
  MatchResult,
  StatisticsMatchHistoryItem,
} from "./types";


const FASTAPI_BASE_URL =
  import.meta.env.VITE_FASTAPI_URL ||
  "http://localhost:8001";


const UNKNOWN_OPPONENT_NAME =
  "Unknown user";


function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


function isPositiveInteger(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  );
}


function isNullablePositiveInteger(
  value: unknown,
): value is number | null {
  return (
    value === null ||
    isPositiveInteger(value)
  );
}


function isMatchResult(
  value: unknown,
): value is MatchResult {
  return (
    value === "win" ||
    value === "loss" ||
    value === "draw"
  );
}


function parseHistoryItem(
  value: unknown,
): MatchHistoryApiItem | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isPositiveInteger(value.game_id) ||
    typeof value.is_bot !== "boolean" ||
    !isMatchResult(value.result) ||
    typeof value.played_at !== "string" ||
    Number.isNaN(
      Date.parse(value.played_at),
    ) ||
    !isNullablePositiveInteger(
      value.tournament_id,
    ) ||
    !isNullablePositiveInteger(
      value.tournament_round,
    )
  ) {
    return null;
  }

  // Bot games must not expose a human opponent ID
  if (
    value.is_bot &&
    value.opponent_id !== null
  ) {
    return null;
  }

  // Human games always require a valid opponent ID
  if (
    !value.is_bot &&
    !isPositiveInteger(
      value.opponent_id,
    )
  ) {
    return null;
  }

  return {
    game_id: value.game_id,
    opponent_id: value.opponent_id,
    is_bot: value.is_bot,
    result: value.result,
    played_at: value.played_at,
    tournament_id:
      value.tournament_id,
    tournament_round:
      value.tournament_round,
  };
}


function parseHistoryResponse(
  value: unknown,
): MatchHistoryApiItem[] {
  if (!Array.isArray(value)) {
    throw new Error(
      "Invalid statistics history response",
    );
  }

  const history = value.map(
    parseHistoryItem,
  );

  if (
    history.some(
      (item) => item === null,
    )
  ) {
    throw new Error(
      "Invalid statistics history item",
    );
  }

  return history as MatchHistoryApiItem[];
}


function parsePublicUsername(
  value: unknown,
  expectedUserId: number,
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.id !== expectedUserId ||
    typeof value.username !== "string" ||
    value.username.trim().length === 0
  ) {
    return null;
  }

  return value.username;
}


async function fetchPublicUsername(
  userId: number,
  signal?: AbortSignal,
): Promise<string> {
  const response = await api.get<unknown>(
    `/api/users/${userId}/public-profile/`,
    {
      signal,
    },
  );

  const username = parsePublicUsername(
    response.data,
    userId,
  );

  if (username === null) {
    throw new Error(
      "Invalid public user profile response",
    );
  }

  return username;
}


function getUniqueOpponentIds(
  history: MatchHistoryApiItem[],
): number[] {
  const opponentIds = new Set<number>();

  for (const item of history) {
    if (
      !item.is_bot &&
      item.opponent_id !== null
    ) {
      opponentIds.add(
        item.opponent_id,
      );
    }
  }

  return Array.from(opponentIds);
}


async function loadOpponentNames(
  history: MatchHistoryApiItem[],
  signal?: AbortSignal,
): Promise<Map<number, string>> {
  const opponentIds =
    getUniqueOpponentIds(history);

  const profileResults =
    await Promise.allSettled(
      opponentIds.map(
        async (userId) => ({
          userId,
          username:
            await fetchPublicUsername(
              userId,
              signal,
            ),
        }),
      ),
    );

  const opponentNames =
    new Map<number, string>();

  for (const result of profileResults) {
    if (result.status !== "fulfilled") {
      continue;
    }

    opponentNames.set(
      result.value.userId,
      result.value.username,
    );
  }

  return opponentNames;
}


function resolveOpponentName(
  item: MatchHistoryApiItem,
  opponentNames: Map<number, string>,
): string {
  if (item.is_bot) {
    return "Bot";
  }

  if (item.opponent_id === null) {
    return UNKNOWN_OPPONENT_NAME;
  }

  return (
    opponentNames.get(
      item.opponent_id,
    ) ??
    UNKNOWN_OPPONENT_NAME
  );
}


function buildStatisticsHistory(
  history: MatchHistoryApiItem[],
  opponentNames: Map<number, string>,
): StatisticsMatchHistoryItem[] {
  return history.map((item) => ({
    ...item,
    opponentName:
      resolveOpponentName(
        item,
        opponentNames,
      ),
  }));
}


export async function fetchStatisticsHistory(
  signal?: AbortSignal,
): Promise<StatisticsMatchHistoryItem[]> {
  // Reuse the authenticated Axios client while targeting the FastAPI service
  const response = await api.get<unknown>(
    "/api/statistics/history/me/",
    {
      baseURL: FASTAPI_BASE_URL,
      signal,
    },
  );

  const history =
    parseHistoryResponse(
      response.data,
    );

  // Resolve only unique human opponents through the safe Django public profile API
  const opponentNames =
    await loadOpponentNames(
      history,
      signal,
    );

  return buildStatisticsHistory(
    history,
    opponentNames,
  );
}