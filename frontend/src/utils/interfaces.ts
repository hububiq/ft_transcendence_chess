export interface UserData {
  username: string;
  email: string;
  date_joined: string;
  profile: {
    avatar: string;
    bio: string;
    current_streak: number;
    elo_rating: number;
    location: string;
    peak_rating: number;
    total_games: number;
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

export interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isInitializing: boolean;
}
