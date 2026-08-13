import { api } from "./axios";

const FASTAPI_BASE_URL =
  import.meta.env.VITE_FASTAPI_URL || "http://localhost:8001";

const config = { baseURL: FASTAPI_BASE_URL };

// Interfaces
export interface CreateTournamentRequest {
  creator_id: number;
  size: number;
}

export interface JoinTournamentRequest {
  player_id: number;
}

export interface Tournament {
  id: number;
  status: string;
  creator_id: number;
  size: number;
  winner_id?: number | null;
  create_at?: string;
}

export interface PlayerTournamentResponse {
  active: boolean;
  tournament: Tournament;
}

// --- API Functions ---

// GET /api/tournaments/
export async function getTournaments(): Promise<Tournament[]> {
  const response = await api.get<Tournament[]>("api/tournaments/", config);
  return response.data;
}

// GET /api/tournaments/{tournament_id}/
export async function getTournament(
  tournamentId: number | string,
): Promise<any> {
  const response = await api.get(`/api/tournaments/${tournamentId}`, config);
  return response.data;
}

// POST /api/tournaments/create
export async function createTournament(
  payload: CreateTournamentRequest,
): Promise<Tournament> {
  const response = await api.post<Tournament>("/api/tournaments/create", null, {
    ...config,
    params: payload,
  });
  return response.data;
}

// POST /api/tournaments/{tournament_id}/join
export async function joinTournament(
  tournamentId: number | string,
  payload: JoinTournamentRequest,
): Promise<any> {
  const response = await api.post(
    `/api/tournaments/${tournamentId}/join`,
    null,
    { ...config, params: payload }, // payload as query parameter
  );
  return response.data;
}

// GET /api/tournaments/player/{player_id}
export async function getPlayerTournament(
  playerId: number,
): Promise<PlayerTournamentResponse> {
  const response = await api.get(`/api/tournaments/player/${playerId}`, config);
  return response.data;
}

// GET /api/tournaments/{tournament_id}/next/{player_id}
export async function getNextMatch(
  tournamentId: number | string,
  playerId: number | string,
): Promise<any> {
  const response = await api.get(
    `/api/tournaments/${tournamentId}/next/${playerId}`,
    config,
  );
  return response.data;
}

// GET /api/tournaments/{tournament_id}/bracket
export async function getTournamentBracket(
  tournamentId: number | string,
): Promise<any> {
  const response = await api.get(
    `/api/tournaments/${tournamentId}/bracket`,
    config,
  );
  return response.data;
}

// GET /api/tournaments/{tournament_id}/history
export async function getTournamentHistory(
  tournamentId: number | string,
): Promise<any> {
  const response = await api.get(
    `/api/tournaments/${tournamentId}/history`,
    config,
  );
  return response.data;
}

// GET /{tournament_id}/
export async function getTournamentDetails(tournamentId: number | string) {
  const response = await api.get(`/api/tournaments/${tournamentId}/`, config);
  return response.data;
}

// Leaving tournament
export async function leaveTournament(
  tournamentId: number,
  data: { player_id: number },
) {
  const response = await api.post(
    `/api/tournaments/${tournamentId}/leave`,
    data,
  );
  return response.data;
}

// Delete Trournament
export async function deleteTournament(tournamentId: number) {
  // Uses api.delete to send the authorization headers automatically
  const response = await api.delete(`/api/tournaments/${tournamentId}/delete`);
  return response.data;
}
