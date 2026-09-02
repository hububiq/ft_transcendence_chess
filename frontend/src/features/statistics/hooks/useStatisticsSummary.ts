import {
  useEffect,
  useState,
} from "react";

import { getTournamentWins } from "../../../api/tournamentApi";
import { useUser } from "../../../hooks/useUser";


export function useStatisticsSummary() {
  const {
    user,
    loading,
    error,
  } = useUser();

  const [
    tournamentsWon,
    setTournamentsWon,
  ] = useState<number | null>(null);


  useEffect(() => {
    let isDisposed = false;


    const loadTournamentWins =
      async () => {
        try {
          const response =
            await getTournamentWins();

          if (isDisposed) {
            return;
          }

          setTournamentsWon(
            response.tournaments_won,
          );
        } catch {
          if (isDisposed) {
            return;
          }

          // Keep the remaining statistics usable if tournament data is unavailable
          setTournamentsWon(null);
        }
      };


    void loadTournamentWins();


    return () => {
      // Ignore tournament responses after the Statistics page unmounts
      isDisposed = true;
    };
  }, []);


  return {
    user,
    isLoading: loading,
    errorMessage: error || null,
    tournamentsWon,
  };
}