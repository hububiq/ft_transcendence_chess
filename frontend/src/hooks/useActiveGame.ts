import { useEffect, useState } from "react";
import {
  fetchActiveGame,
  type ActiveGameResponse,
} from "../api/gameApi";
import { useGlobalChat } from "../features/chat/context/GlobalChatProvider";

interface UseActiveGameResult {
  activeGame: ActiveGameResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
}


export function useActiveGame(): UseActiveGameResult {
  const { activeGameRevision } = useGlobalChat();
  const [activeGame, setActiveGame] =
    useState<ActiveGameResponse | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);


  useEffect(() => {
    const controller = new AbortController();
    let isDisposed = false;


    const loadActiveGame = async () => {
      try {
        // Load the active game for the authenticated user from FastAPI
        const game = await fetchActiveGame(
          controller.signal,
        );

        if (isDisposed) {
          return;
        }

        setActiveGame(game);
        setErrorMessage(null);
      } catch {
        if (isDisposed) {
          return;
        }

        setActiveGame(null);
        setErrorMessage(
          "Active game could not be loaded",
        );
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };


    void loadActiveGame();


    return () => {
      // Cancel the request when the dashboard unmounts or StrictMode restarts the effect
      isDisposed = true;
      controller.abort();
    };
  }, [activeGameRevision]);


  return {
    activeGame,
    isLoading,
    errorMessage,
  };
}