import {
  useEffect,
  useState,
} from "react";

import { fetchLeaderboard } from "../leaderboardApi";
import type {
  LeaderboardPlayer,
} from "../types";


interface UseLeaderboardResult {
  topPlayers: LeaderboardPlayer[];
  currentUser: LeaderboardPlayer | null;
  isLoading: boolean;
  errorMessage: string | null;
}


export function useLeaderboard():
  UseLeaderboardResult {
  const [
    topPlayers,
    setTopPlayers,
  ] = useState<LeaderboardPlayer[]>([]);

  const [
    currentUser,
    setCurrentUser,
  ] = useState<LeaderboardPlayer | null>(
    null,
  );

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);


  useEffect(() => {
    const controller =
      new AbortController();

    let isDisposed = false;


    const loadLeaderboard =
      async () => {
        try {
          const leaderboard =
            await fetchLeaderboard(
              controller.signal,
            );

          if (isDisposed) {
            return;
          }

          setTopPlayers(
            leaderboard.top_players,
          );

          setCurrentUser(
            leaderboard.current_user,
          );

          setErrorMessage(null);
        } catch {
          if (isDisposed) {
            return;
          }

          setTopPlayers([]);
          setCurrentUser(null);

          setErrorMessage(
            "Leaderboard could not be loaded",
          );
        } finally {
          if (!isDisposed) {
            setIsLoading(false);
          }
        }
      };


    void loadLeaderboard();


    return () => {
      // Cancel the request when the page unmounts or StrictMode restarts the effect
      isDisposed = true;
      controller.abort();
    };
  }, []);


  return {
    topPlayers,
    currentUser,
    isLoading,
    errorMessage,
  };
}