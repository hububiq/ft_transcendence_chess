// Describe only the profile fields exposed by the safe public profile endpoint
export interface PublicUserProfileDetails {
  avatar: string | null;
  oauth_avatar_url: string | null;
  location: string;
  bio: string;
  elo_rating: number;
  peak_rating: number;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  current_streak: number;
}


// Keep public user identity separate from private account information
export interface PublicUserProfile {
  id: number;
  username: string;
  profile: PublicUserProfileDetails;
}