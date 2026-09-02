export interface UserData {
  id?: number;
  username: string;
  email: string;
  date_joined: string;
  profile: {
    avatar: string;
    oauth_avatar_url?: string | null;
    bio: string;
    current_streak: number;
    elo_rating: number;
    location: string;
    peak_rating: number;
    total_games: number;
    wins: number;
    losses: number;
    draws: number;
  };
}

export interface User {
  id: number;
  email: string;
  oauth_provider: string | null;
  oauth_id: string | null;
  is_bot: boolean;
  bot_difficulty: number | null;
  date_join: string;
}
