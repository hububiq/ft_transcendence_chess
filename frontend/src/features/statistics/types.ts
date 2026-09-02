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
