export type MatchResult =
  | "win"
  | "loss"
  | "draw";


export interface MatchHistoryApiItem {
  game_id: number;
  opponent_id: number | null;
  is_bot: boolean;
  result: MatchResult;
  played_at: string;
  tournament_id: number | null;
  tournament_round: number | null;
}


export interface StatisticsMatchHistoryItem
  extends MatchHistoryApiItem {
  opponentName: string;
}

export interface LeaderboardPlayer {
  rank: number;
  user_id: number;
  username: string;
  elo_rating: number;
  total_games: number;
  wins: number;
  win_rate: number;
  is_current_user: boolean;
}


export interface LeaderboardResponse {
  top_players: LeaderboardPlayer[];
  current_user: LeaderboardPlayer | null;
}