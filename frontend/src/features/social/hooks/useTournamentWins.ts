import {
  useEffect,
  useState,
} from "react";

import { getPlayerTournamentWins } from "../../../api/tournamentApi";


interface UseTournamentWinsResult {
  tournamentsWon: number | null;
}


export function useTournamentWins(
  userId: number,
): UseTournamentWinsResult {
  const [
    tournamentsWon,
    setTournamentsWon,
  ] = useState<number | null>(null);

  useEffect(() => {
    let isDisposed = false;

    const loadTournamentWins = async () => {
      try {
        const response =
          await getPlayerTournamentWins(
            userId,
          );

        if (!isDisposed) {
          setTournamentsWon(
            response.tournaments_won,
          );
        }
      } catch (error) {
        if (!isDisposed) {
          console.error(
            "Failed to load tournament wins:",
            error,
          );
        }
      }
    };

    void loadTournamentWins();

    return () => {
      // Ignore responses that arrive after the hover card closes
      isDisposed = true;
    };
  }, [userId]);

  return {
    tournamentsWon,
  };
}