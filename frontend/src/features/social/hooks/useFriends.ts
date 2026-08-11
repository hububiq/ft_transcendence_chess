import { useEffect, useState } from "react";

import { api } from "../../../api/axios";


export interface Friend {
  id: number;
  username: string;
  profile: {
    elo_rating: number;
  };
}


interface UseFriendsResult {
  friends: Friend[];
  isLoading: boolean;
  errorMessage: string | null;
}


export function useFriends(): UseFriendsResult {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isDisposed = false;

    const loadFriends = async () => {
      try {
        // Use the existing authenticated Axios client for the Django friends endpoint
        const response = await api.get<Friend[]>(
          "/api/friends/",
          { signal: controller.signal },
        );

        if (isDisposed) {
          return;
        }

        setFriends(response.data);
        setErrorMessage(null);
      } catch {
        if (isDisposed) {
          return;
        }

        setFriends([]);
        setErrorMessage("Friends list could not be loaded");
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    void loadFriends();

    return () => {
      // Cancel the request when the sidebar unmounts or StrictMode restarts the effect
      isDisposed = true;
      controller.abort();
    };
  }, []);

  return {
    friends,
    isLoading,
    errorMessage,
  };
}