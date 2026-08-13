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
  getTournamentDetails,
  leaveTournament,
  deleteTournament,
  type Tournament as TournamentType,
} from "../../api/tournamentApi";

const rounds = [
  {
    title: "Quarterfinals",
    matches: [],
  },
  {
    title: "Semifinals",
    matches: [],
  },
  {
    title: "Finals",
    matches: [],
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
  const [bracketData, setBracketData] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);

  // Check User State on Load
  useEffect(() => {
    if (!user?.id) return;

    const fetchTournamentState = async () => {
      setLoading(true);
      try {
        // Is this player already in a tournament?
        const currentTourney = await getPlayerTournament(user.id);

        if (currentTourney && currentTourney.tournament) {
          setActiveTournament(currentTourney.tournament);
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

  useEffect(() => {
    if (!activeTournament?.id) return;

    const loadBracket = async () => {
      try {
        // fetch full tournament details
        const details = await getTournamentDetails(activeTournament.id);
        if (details && details.participants) {
          setParticipants(details.participants);
        }

        const rawData = await getTournamentBracket(activeTournament.id);

        if (rawData && rawData.rounds) {
          const roundKeys = Object.keys(rawData.rounds);

          if (roundKeys.length === 0) {
            setBracketData([]);
          } else {
            const formattedRounds = roundKeys.map((roundNum) => ({
              title: `Round ${roundNum}`,
              matches: rawData.rounds[roundNum].map((match: any) => ({
                id: match.id,
                // Fallback to ID if the backend hasn't joined the user tables yet
                p1:
                  match.player1?.username || `Player ${match.player1}` || "TBD",
                p2:
                  match.player2?.username || `Player ${match.player2}` || "TBD",
                p1Score: match.player1_score ?? null,
                p2Score: match.player2_score ?? null,
                isCurrent: match.status === "in_progress",
                winner: match.winner?.username || match.winner,
              })),
            }));

            setBracketData(formattedRounds);
          }
        }

        if (user?.id) {
          const matchData = await getNextMatch(activeTournament.id, user.id);
          if (matchData && matchData.game_id) {
            setNextMatch(matchData);
          } else {
            setNextMatch(null);
          }
        }
      } catch (error) {
        console.error("Failed to load tournament data:", error);
      }
    };

    loadBracket();

    // Polling interval to refresh the bracket every 10 seconds
    // so you can see other players' scores update!
    const intervalId = setInterval(loadBracket, 10000);
    return () => clearInterval(intervalId);
  }, [activeTournament?.id, user?.id]);

  // CREATE
  const handleCreate = async () => {
    if (!user?.id) return;
    try {
      // From backedn: tournaments auto-start at 4 players
      const newTourney = await createTournament({
        creator_id: user.id,
        size: 4,
      });

      // Auto-join the creator to their own tournament to save them a click
      await joinTournament(newTourney.id, { player_id: user.id });

      const current = await getPlayerTournament(user.id);
      setActiveTournament(current.tournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
    }
  };

  // JOIN
  const handleJoin = async (tournamentId: number) => {
    if (!user?.id) return;
    try {
      await joinTournament(tournamentId, { player_id: user.id });
      const current = await getPlayerTournament(user.id);
      setActiveTournament(current.tournament);
    } catch (error) {
      console.error("Error joining tournament:", error);
    }
  };

  // LEAVE
  const handleLeave = async () => {
    if (!user?.id || !activeTournament?.id) return;
    try {
      // Tell backend to remove us
      await leaveTournament(activeTournament.id);

      // Wipe the local state to kick the user back to the lobby
      setActiveTournament(null);
      setBracketData([]);
      setParticipants([]);
    } catch (error) {
      console.error("Error leaving tournament:", error);
    }
  };

  // DELETE
  const handleDelete = async () => {
    if (!user?.id || !activeTournament?.id) return;

    // Safety check just like the backend
    if (user.id !== activeTournament.creator_id) {
      alert("Only the tournament creator can delete this lobby.");
      return;
    }

    try {
      await deleteTournament(activeTournament.id);

      // Wipe the local state to kick everyone back to the lobby
      setActiveTournament(null);
      setBracketData([]);
      setParticipants([]);
    } catch (error) {
      console.error("Error deleting tournament:", error);
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
                key={tourney.id}
                className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-xl flex flex-col gap-4 hover:border-neutral-700 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-white">
                    Tournament #{tourney.id}
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
                  onClick={() => handleJoin(tourney.id)}
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
            Tournament #{activeTournament.id}
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

      {/* If bracketData is empty, show the waiting room */}
      {bracketData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-neutral-500 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />

          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              Waiting for Players...
            </h3>
            <p className="text-sm">
              The bracket will generate automatically once the lobby is full.
            </p>
          </div>

          {/* 💡 Participant List UI */}
          <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-6 w-full max-w-md mt-4">
            <div className="flex justify-between items-center mb-4 border-b border-neutral-900 pb-4">
              <span className="font-bold text-white">Registered Players</span>
              <span className="bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full text-xs font-bold border border-purple-900/50">
                {participants.length} / {activeTournament.size || 4} Joined
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {participants.length === 0 ? (
                <span className="text-sm text-neutral-600 text-center py-4">
                  No players have joined yet.
                </span>
              ) : (
                participants.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 bg-black p-3 rounded-lg border border-neutral-900"
                  >
                    <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400">
                      {i + 1}
                    </div>
                    {/* Note: Backend only sends player_id right now. We show "Player X" until they add usernames! */}
                    <span className="text-neutral-300 font-medium">
                      Player {p.player_id}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 💡 Role-based Buttons */}
          <div className="mt-4">
            {user?.id === activeTournament.creator_id ? (
              <button
                onClick={handleDelete}
                className="border border-red-900/50 text-red-500 bg-red-950/20 hover:bg-red-900/40 px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Delete Tournament
              </button>
            ) : (
              <button
                onClick={handleLeave}
                className="border border-neutral-700 text-neutral-400 bg-neutral-900/50 hover:bg-neutral-800 hover:text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Leave Tournament
              </button>
            )}
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
