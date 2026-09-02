import {
  useEffect,
  useState,
} from "react";

import { fetchStatisticsHistory } from "../statisticsApi";
import type {
  StatisticsMatchHistoryItem,
} from "../types";


interface UseStatisticsHistoryResult {
  matches: StatisticsMatchHistoryItem[];
  isLoading: boolean;
  errorMessage: string | null;
}


export function useStatisticsHistory():
  UseStatisticsHistoryResult {
  const [matches, setMatches] =
    useState<
      StatisticsMatchHistoryItem[]
    >([]);

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


    const loadHistory = async () => {
      try {
        const loadedMatches =
          await fetchStatisticsHistory(
            controller.signal,
          );

        if (isDisposed) {
          return;
        }

        setMatches(loadedMatches);
        setErrorMessage(null);
      } catch {
        if (isDisposed) {
          return;
        }

        setMatches([]);
        setErrorMessage(
          "Match history could not be loaded",
        );
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };


    void loadHistory();


    return () => {
      // Cancel pending requests when Statistics unmounts or StrictMode restarts the effect
      isDisposed = true;
      controller.abort();
    };
  }, []);


  return {
    matches,
    isLoading,
    errorMessage,
  };
}