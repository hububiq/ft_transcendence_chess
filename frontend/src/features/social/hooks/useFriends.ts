import { useCallback, useEffect, useState } from "react";
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
  pendingFriendId: number | null;
  actionErrorMessage: string | null;
  addFriend: (userId: number) => Promise<void>;
  removeFriend: (userId: number) => Promise<void>;
}


export function useFriends(
friendsRevision: number,
): UseFriendsResult {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [pendingFriendId, setPendingFriendId] =
    useState<number | null>(null);
  const [actionErrorMessage, setActionErrorMessage] =
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
  }, [friendsRevision]);

  const refreshFriends = useCallback(async () => {
    // Reload from Django so the backend remains the source of truth after each mutation
    const response = await api.get<Friend[]>("/api/friends/");

    setFriends(response.data);
    setErrorMessage(null);
  }, []);

  const addFriend = useCallback(
    async (userId: number) => {
      setPendingFriendId(userId);
      setActionErrorMessage(null);

      try {
        // Reuse the existing authenticated Django endpoint for adding a friend
        await api.post(`/api/friends/add/${userId}/`);
      } catch {
        setActionErrorMessage("Friend could not be added");
        setPendingFriendId(null);
        return;
      }

      try {
        await refreshFriends();
      } catch {
        setActionErrorMessage("Friends list could not be refreshed");
      } finally {
        setPendingFriendId(null);
      }
    },
    [refreshFriends],
  );

  const removeFriend = useCallback(
    async (userId: number) => {
      setPendingFriendId(userId);
      setActionErrorMessage(null);

      try {
        // Reuse the existing authenticated Django endpoint for removing a friend
        await api.post(`/api/friends/remove/${userId}/`);
      } catch {
        setActionErrorMessage("Friend could not be removed");
        setPendingFriendId(null);
        return;
      }

      try {
        await refreshFriends();
      } catch {
        setActionErrorMessage("Friends list could not be refreshed");
      } finally {
        setPendingFriendId(null);
      }
    },
    [refreshFriends],
  );

  return {
    friends,
    isLoading,
    errorMessage,
    pendingFriendId,
    actionErrorMessage,
    addFriend,
    removeFriend,
  };
}
