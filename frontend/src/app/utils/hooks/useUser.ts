import { useState, useEffect } from "react";
import { api } from "../../../api/axios";

interface UserData {
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

export function useUser() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchMe = async () => {
      try {
        setError("");
        const response = await api.get("/api/me/");

        if (isMounted) setUser(response.data);
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.response?.data?.detail || err.message || "Failed to load user",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMe();

    return () => {
      isMounted = false;
    }; // cleanup function
  }, []);

  return { user, loading, error };
}
