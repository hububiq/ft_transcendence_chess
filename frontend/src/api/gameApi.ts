// src/api/gameApi.ts
import { api } from "./axios";

const FASTAPI_BASE_URL =
  import.meta.env.VITE_FASTAPI_URL || "http://localhost:8001";

export interface BotMatchRequest {
  user_id: number;
}

export interface BotMatchResponse {
  game_id: number;
}

export interface ActiveGameResponse {
  game_id: number;
  color: "white" | "black";
  opponent_id: number;
  fen: string | null;
}

export async function createBotGame(
  payload: BotMatchRequest,
): Promise<BotMatchResponse> {
  const response = await api.post<BotMatchResponse>(
    "/api/games/vs-bot/",
    payload,
    {
      baseURL: FASTAPI_BASE_URL,
    },
  );
  return response.data;
}

export async function fetchActiveGame(
  signal?: AbortSignal,
): Promise<ActiveGameResponse | null> {
  const response = await api.get<ActiveGameResponse | null>(
    "/api/games/active/",
    {
      baseURL: FASTAPI_BASE_URL,
      signal,
    },
  );

  return response.data;
}
