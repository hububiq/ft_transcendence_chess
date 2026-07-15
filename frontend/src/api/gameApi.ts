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
