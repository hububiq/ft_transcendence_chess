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
