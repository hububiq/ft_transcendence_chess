import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Trophy, Plus, Users, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useUser } from "../../hooks/useUser";
import {
  getPlayerTournament,
  getTournaments,
  createTournament,
  joinTournament,
  getTournamentBracket,
  getNextMatch,
  type Tournament as TournamentType,
} from "../../api/tournamentApi";

const rounds = [
  {
    title: "Quarterfinals",
    matches: [
      {
        id: 1,
        p1: "GrandMaster99",
        p2: "ChessKing",
        p1Score: 1,
        p2Score: 0,
        isCurrent: true,
        winner: "GrandMaster99",
      },
      {
        id: 2,
        p1: "KnightRider",
        p2: "PawnStorm",
        p1Score: 0,
        p2Score: 1,
        isCurrent: false,
        winner: "PawnStorm",
      },
      {
        id: 3,
        p1: "QueenGambit",
        p2: "RookSolid",
        p1Score: 1,
        p2Score: 0,
        isCurrent: false,
        winner: "QueenGambit",
      },
      {
        id: 4,
        p1: "BishopPro",
        p2: "EndgameGuru",
        p1Score: 0,
        p2Score: 1,
        isCurrent: false,
        winner: "EndgameGuru",
      },
    ],
  },
  {
    title: "Semifinals",
    matches: [
      {
        id: 5,
        p1: "GrandMaster99",
        p2: "PawnStorm",
        p1Score: null,
        p2Score: null,
        isCurrent: true,
      },
      {
        id: 6,
        p1: "QueenGambit",
        p2: "EndgameGuru",
        p1Score: null,
        p2Score: null,
        isCurrent: false,
      },
    ],
  },
  {
    title: "Finals",
    matches: [
      {
        id: 7,
        p1: "TBD",
        p2: "TBD",
        p1Score: null,
        p2Score: null,
        isCurrent: false,
      },
    ],
  },
];

export function Tournament() {
  const navigate = useNavigate();
  const [nextMatch, setNextMatch] = useState<any>(null);
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [activeTournament, setActiveTournament] =
    useState<TournamentType | null>(null);
  const [lobbyTournaments, setLobbyTournaments] = useState<TournamentType[]>(
    [],
  );
  const [bracketData, setBracketData] = useState(rounds);

  // Check User State on Load
  useEffect(() => {
    if (!user?.id) return;

    const fetchTournamentState = async () => {
      setLoading(true);
      try {
        // Ask backend Is this player already in a tournament?
        const currentTourney = await getPlayerTournament(user.id);

        if (currentTourney && currentTourney.tournament_id) {
          setActiveTournament(currentTourney);
        } else {
          // If not, fetch all available tournaments for the lobby
          const allTournaments = await getTournaments();
          // Filter to show only tournaments that are waiting for players
          setLobbyTournaments(
            Array.isArray(allTournaments) ? allTournaments : [],
          );
        }
      } catch (error) {
        console.error("Failed to load tournament data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentState();
  }, [user?.id]);

  // STEP 4: Fetch and map the dynamic bracket
  useEffect(() => {
    if (!activeTournament?.id) return;

    const loadBracket = async () => {
      try {
        const rawData = await getTournamentBracket(activeTournament.tournament_id);

        // Ensure the backend actually sent something before we try to map it
        if (rawData && rawData.rounds) {
          const formattedRounds = rawData.rounds.map(
            (round: any, index: number) => ({
              title: round.title || `Round ${index + 1}`,
              matches: round.matches.map((match: any) => ({
                id: match.id,
                p1: match.player1?.username || "TBD",
                p2: match.player2?.username || "TBD",
                p1Score: match.player1_score ?? null,
                p2Score: match.player2_score ?? null,
                isCurrent: match.status === "in_progress", // Highlights the active match block
                winner: match.winner?.username,
              })),
            }),
          );
          setBracketData(formattedRounds);
        }

        if (user?.id) {
          const matchData = await getNextMatch(activeTournament.tournament_id, user.id);

          // Assuming the backend returns an object with a game_id when it's time to play
          if (matchData && matchData.game_id) {
            setNextMatch(matchData);
          } else {
            setNextMatch(null);
          }
        }
      } catch (error) {
        console.error("Failed to load bracket data:", error);
      }
    };

    loadBracket();

    // Polling interval to refresh the bracket every 10 seconds
    // so you can see other players' scores update!
    const intervalId = setInterval(loadBracket, 10000);
    return () => clearInterval(intervalId);
  }, [activeTournament?.tournament_id]);

  // ACTIONS
  const handleCreate = async () => {
    if (!user?.id) return;
    try {
      // From backedn: tournaments auto-start at 4 players
      const newTourney = await createTournament({
        creator_id: user.id,
        size: 4,
      });

      // Auto-join the creator to their own tournament to save them a click
      await joinTournament(newTourney.tournament_id, { player_id: user.id });

      const current = await getPlayerTournament(user.id);
      setActiveTournament(current);
    } catch (error) {
      console.error("Error creating tournament:", error);
    }
  };

  const handleJoin = async (tournamentId: number) => {
    if (!user?.id) return;
    try {
      await joinTournament(tournamentId, { player_id: user.id });
      const current = await getPlayerTournament(user.id);
      setActiveTournament(current);
    } catch (error) {
      console.error("Error joining tournament:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading Tournament Data...
      </div>
    );
  }

  // --- LOBBY VIEW ---
  if (!activeTournament) {
    return (
      <div className="p-8 h-full flex flex-col max-w-7xl mx-auto">
        <div className="mb-10 flex items-center justify-between pt-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Trophy className="w-8 h-8 text-purple-500" />
              Tournament Lobby
            </h2>
            <p className="text-neutral-500 mt-2 text-sm">
              Join an existing bracket or start a new one.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Tournament
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lobbyTournaments.length === 0 ? (
            <div className="col-span-full text-center py-16 border border-neutral-900 border-dashed rounded-xl text-neutral-500">
              No open tournaments found. Be the first to create one!
            </div>
          ) : (
            lobbyTournaments.map((tourney) => (
              <div
                key={tourney.tournament_id}
                className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-xl flex flex-col gap-4 hover:border-neutral-700 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-white">
                    Tournament #{tourney.tournament_id}
                  </h3>
                  <span className="bg-neutral-900 text-neutral-400 text-xs px-2 py-1 rounded">
                    {tourney.status || "Waiting"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-neutral-500 text-sm">
                  <Users className="w-4 h-4" />
                  <span>Capacity: {tourney.size || 4} Players</span>
                </div>
                <button
                  onClick={() => handleJoin(tourney.tournament_id)}
                  className="mt-2 w-full py-2 bg-blue-950/30 hover:bg-blue-900/40 text-blue-500 border border-blue-900/30 rounded-lg text-sm font-medium transition-colors"
                >
                  Join Tournament
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // --- BRACKET VIEW ---
  return (
    <div className="p-8 h-full flex flex-col max-w-7xl mx-auto">
      <div className="mb-10 flex items-center justify-between pt-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-purple-500" />
            Tournament #{activeTournament.tournament_id}
          </h2>
          {/* 💡 Dynamic status text */}
          <p className="text-neutral-500 mt-2 text-sm">
            {nextMatch
              ? "Your opponent is ready. Join the match now!"
              : "Waiting for other matches to finish..."}
          </p>
        </div>

        {/* 💡 The Join Match Button */}
        {nextMatch && (
          <button
            onClick={() => navigate(`/game/${nextMatch.game_id}`)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] animate-pulse"
          >
            Play Next Match
          </button>
        )}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center py-10">
        <div className="flex gap-16 min-w-max mx-auto px-8">
          {bracketData.map((round, rIndex) => (
            <div
              key={round.title}
              className="flex flex-col justify-around min-w-[260px]"
            >
              <h3 className="text-center text-xs font-bold text-neutral-600 uppercase tracking-widest mb-8">
                {round.title}
              </h3>

              <div className="flex flex-col gap-8 flex-1 justify-around">
                {round.matches.map((match) => (
                  <div key={match.id} className="relative">
                    {/* Connector Lines */}
                    {rIndex < rounds.length - 1 && (
                      <div className="absolute top-1/2 -right-16 w-16 h-[1px] bg-neutral-800 pointer-events-none">
                        {match.id % 2 !== 0 && (
                          <div className="absolute right-0 top-0 w-[1px] h-[calc(50%+2rem)] bg-neutral-800" />
                        )}
                        {match.id % 2 === 0 && (
                          <div className="absolute right-0 bottom-0 w-[1px] h-[calc(50%+2rem)] bg-neutral-800" />
                        )}
                      </div>
                    )}

                    <div
                      className={clsx(
                        "bg-black border rounded-lg overflow-hidden flex flex-col shadow-2xl z-10 relative",
                        match.isCurrent
                          ? "border-blue-500/50"
                          : "border-neutral-900",
                      )}
                    >
                      {/* Player 1 */}
                      <div
                        className={clsx(
                          "flex justify-between items-center p-3 border-b border-neutral-900",
                          match.winner === match.p1
                            ? "bg-neutral-900/50"
                            : "bg-black",
                          match.p1 === "GrandMaster99"
                            ? "text-blue-400 font-medium"
                            : "text-neutral-300",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] text-neutral-500">
                            {match.p1.charAt(0)}
                          </div>
                          <span className="text-sm">{match.p1}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {match.p1Score ?? "-"}
                        </span>
                      </div>

                      {/* Player 2 */}
                      <div
                        className={clsx(
                          "flex justify-between items-center p-3",
                          match.winner === match.p2
                            ? "bg-neutral-900/50"
                            : "bg-black",
                          match.p2 === "GrandMaster99"
                            ? "text-blue-400 font-medium"
                            : "text-neutral-300",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] text-neutral-500">
                            {match.p2.charAt(0)}
                          </div>
                          <span className="text-sm">{match.p2}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {match.p2Score ?? "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
