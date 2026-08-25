import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Trophy, Plus, Users, Loader2, Play } from "lucide-react";
import clsx from "clsx";
import { useUser } from "../../hooks/useUser";
import { api } from "../../api/axios";
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

import { useWebSocket } from "../../hooks/useWebSocket";

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
  const [isStarting, setIsStarting] = useState(false);
  const [userNames, setUserNames] = useState<Record<int, string>>({});

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const handleLobbyMessage = (data: any) => {
    console.log("Lobby WebSocket Message:", data);
    switch (data.type) {
      case "match_start":
        if (!data.round_number || data.round_number === 1) {
          console.log("Match starting! Redirecting to Game:", data.game_id);
          navigate(`/game/${data.game_id}`);
        } else {
          // It's Round 2+. Don't teleport them. Just refresh the UI so the Blue Button appears
          console.log("Next round is ready! Showing the Play button.");
          setRefreshTrigger((prev) => prev + 1);
        }
        break;
      case "tournament_won":
        setShowWinnerModal(true);
        break;
      case "tournament_updated":
        // Instantly trigger a database re-fetch when someone joins/leaves!
        setRefreshTrigger((prev) => prev + 1);
        break;
    }
  };

  useWebSocket({
    url: user?.id ? `${import.meta.env.VITE_WS_BASE_URL}/ws/lobby/${user.id}` : "",
    enabled: !!user?.id, // Keep the lobby socket open as long as they are logged in
    onMessage: handleLobbyMessage,
  });


  // Fetch participats usernames
  useEffect(() => {
    const fetchNames = async () => {
      try {
        const res = await api.get(
          `${import.meta.env.VITE_BASE_API_URL}/api/users/`,
        );
        const nameMap: Record<number, string> = {};
        res.data.forEach((u: any) => {
          nameMap[u.id] = u.username;
        });
        setUserNames(nameMap);
      } catch (e) {
        console.error("Failed to fetch usernames");
      }
    };
    fetchNames();
  }, []);

  // Check User State on Load
  useEffect(() => {
    if (!user?.id) return;

    const fetchTournamentState = async () => {
      if (!activeTournament && lobbyTournaments.length === 0) {
        setLoading(true);
      }
      try {
        const currentTourney = await getPlayerTournament(user.id);
        if (currentTourney && currentTourney.tournament) {
          setActiveTournament(currentTourney.tournament);
        } else {
          const allTournaments = await getTournaments();
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
  }, [user?.id, refreshTrigger]);

  useEffect(() => {
    if (!activeTournament?.id) return;

    const loadBracket = async () => {
      setIsRefreshing(true);
      try {
        // fetch full tournament details
        const details = await getTournamentDetails(activeTournament.id);
        console.log("RAW TOURNAMENT DETAILS:", details);
        if (details) {
          if (details.participants) setParticipants(details.participants);
          
          //  Update the tournament state so React knows it is finished!
          if (details.tournament) setActiveTournament(details.tournament);
        }

        const rawData = await getTournamentBracket(activeTournament.id);
        if (rawData && rawData.rounds) {
          const roundKeys = Object.keys(rawData.rounds);
          if (roundKeys.length === 0) {
            setBracketData([]);
          } else {
            const formattedRounds = roundKeys.map((roundNum) => ({
              title: `Round ${roundNum}`,
              matches: rawData.rounds[roundNum].map((match: any) => {
                const p1Name = match.player1
                  ? userNames[match.player1] || `Player ${match.player1}`
                  : "TBD";
                const p2Name = match.player2
                  ? userNames[match.player2] || `Player ${match.player2}`
                  : "TBD";
                const winnerName = match.winner
                  ? userNames[match.winner] || `Player ${match.winner}`
                  : null;

                // Check if the current user is playing in this match slot
                const isUserP1 = match.player1 === user?.id;
                const isUserP2 = match.player2 === user?.id;

                return {
                  id: match.id,
                  p1: p1Name,
                  p2: p2Name,
                  p1Id: match.player1, // <--- ADD THIS
                  p2Id: match.player2, // <--- ADD THIS
                  isUserP1,
                  isUserP2,
                  p1Score: match.player1_score ?? null,
                  p2Score: match.player2_score ?? null,
                  isCurrent: match.status === "in_progress",
                  winner: winnerName,
                  winnerId: match.winner,
                };
              }),
            }));

            setBracketData(formattedRounds);
          }
        }

        if (user?.id) {
          const matchData = await getNextMatch(activeTournament.id, user.id);
          if (matchData && matchData.match) {
            setNextMatch(matchData.match);
          } else {
            setNextMatch(null);
          }
        }
      } catch (error) {
        console.error("Failed to load tournament data:", error);
      } finally {
        setIsRefreshing(false);
      }
    };

    if (Object.keys(userNames).length > 0) {
      loadBracket();
      const intervalId = setInterval(loadBracket, 3000); // <-- Bring this back!
      return () => clearInterval(intervalId);
    }
  }, [activeTournament?.id, user?.id, userNames, refreshTrigger]);

      // The Fireworks  
  useEffect(() => {
    if (activeTournament?.status === "finished" && activeTournament?.winner_id === user?.id) {
      // Small 500ms delay to let the page finish loading before dropping the fireworks!
      const timer = setTimeout(() => setShowWinnerModal(true), 500);
      return () => clearTimeout(timer);
    }
  }, [activeTournament?.status, activeTournament?.winner_id, user?.id]);
  
  // CREATE
  const handleCreate = async () => {
    if (!user?.id) return;
    try {
      const newTourney = await createTournament({
        creator_id: user.id,
        size: 8,
      });
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
      await leaveTournament(activeTournament.id);
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
    if (user.id !== activeTournament.creator_id) {
      alert("Only the tournament creator can delete this lobby.");
      return;
    }
    try {
      await deleteTournament(activeTournament.id);
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

  // Handle Start Tournament
  const handleStartTournament = async () => {
    if (!activeTournament?.id) return;

    setIsStarting(true);
    try {
      await api.post(
        `${import.meta.env.VITE_FASTAPI_URL}/api/tournaments/${activeTournament.id}/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        },
      );
      console.log("Tournament start endpoint successfully triggered.");
    } catch (error) {
      console.error("Failed to start tournament:", error);
      alert("Error starting tournament. Make sure backend is running.");
      setIsStarting(false);
    }
  };

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
                {/* Top Row: Title and Status Badge */}
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-white">
                    Tournament #{tourney.id}
                  </h3>
                  <span className="bg-neutral-900 text-neutral-400 text-xs px-2 py-1 rounded capitalize">
                    {tourney.status || "Waiting"}
                  </span>
                </div>
                
                {/* Middle Row: Capacity */}
                <div className="flex items-center gap-2 text-neutral-500 text-sm">
                  <Users className="w-4 h-4" />
                  <span>Capacity: {tourney.size || 4} Players</span>
                </div>

                {/* Bottom Row: Smart Buttons! */}
                {tourney.status === "waiting" ? (
                  <button
                    onClick={() => handleJoin(tourney.id)}
                    className="mt-2 w-full py-2 bg-blue-950/30 hover:bg-blue-900/40 text-blue-500 border border-blue-900/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    Join Tournament
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTournament(tourney)}
                    className="mt-2 w-full py-2 bg-purple-950/30 hover:bg-purple-900/40 text-purple-500 border border-purple-900/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    Results
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // --- BRACKET/LOBBY MANAGEMENT VIEW ---

  const isEliminated = bracketData.some((round) =>
    round.matches.some(
      (m: any) =>
        (m.isUserP1 || m.isUserP2) && m.winnerId !== null && m.winnerId !== user?.id
    )
  );
  return (
    <div className="p-8 h-full flex flex-col max-w-7xl mx-auto">
      <div className="mb-10 flex items-center justify-between pt-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-purple-500" />
            Tournament #{activeTournament.id}
          </h2>
          {/* Dynamic status text */}
          <p className="text-neutral-500 mt-2 text-sm">
            {nextMatch
              ? "Your opponent is ready. Join the match now!"
              : "Waiting for other matches to finish..."}
          </p>
        </div>

      {/* The Join Match Button / Waiting Status */}
        {nextMatch && nextMatch.game_id ? (
          <button
            onClick={() => navigate(`/game/${nextMatch.game_id}`)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] animate-pulse"
          >
            Play Next Match
          </button>
        ) : !isEliminated && !isRefreshing && activeTournament.status === "ongoing" ? (
          <button
            disabled
            className="flex items-center gap-3 bg-green-950/30 border border-green-900/50 text-green-500 px-8 py-3 rounded-xl font-bold cursor-not-allowed animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.2)]"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            Waiting for next round...
          </button>
        ) : null}
        </div>

      {/* The Eliminated Banner */}
      {activeTournament?.status === "ongoing" && !isRefreshing && isEliminated && (
        <div className="bg-red-950/40 border border-red-900 text-red-500 p-4 rounded-xl text-center font-bold animate-pulse mt-6 shadow-lg">
          You have been eliminated! Watch the live bracket to see who wins the championship.
        </div>
      )}

      {/* The Finished Banner */}
      {activeTournament?.status === "finished" && (
        <div className="bg-green-950/40 border border-green-900 text-green-400 p-6 rounded-xl text-center mt-6 shadow-lg flex flex-col items-center gap-4">
          <p className="text-xl font-bold">
            🏆 Tournament Finished! Winner: {userNames[activeTournament.winner_id] || "Unknown"}
          </p>
          <button 
            onClick={() => {
              setActiveTournament(null); // Clears the UI
              setBracketData([]);        // Empties the bracket
              setNextMatch(null);        // Resets the button
            }} 
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      )}

      {/* If bracketData is empty, show the waiting room */}
      {bracketData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-neutral-500 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />

          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              Waiting for Players...
            </h3>
            <p className="text-sm">
              The bracket will generate automatically once the creator starts
              the match.
            </p>
          </div>

          {/* Participant List UI */}
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
                      {userNames[p.player_id] || `Player ${p.player_id}`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Role-based Buttons and Start Logic*/}
          <div className="mt-6 w-full max-w-md flex flex-col gap-3">
            {user?.id === activeTournament.creator_id ? (
              <>
                {/* Creator only sees 'Start' if 4 or more players have joined */}
                {participants.length >= 4 ? (
                  <button
                    onClick={handleStartTournament}
                    disabled={isStarting} // Disables button to prevent double-clicks
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg transition-colors font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  >
                    {isStarting ? (
                      "Generating Bracket..."
                    ) : (
                      <>
                        <Play className="w-4 h-4" /> Start Tournament
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full text-center py-3 bg-neutral-900 text-neutral-500 rounded-lg border border-neutral-800 text-sm font-medium">
                    Waiting for at least 4 players to start... (
                    {participants.length}/4)
                  </div>
                )}

                {/* Delete Button */}
                <button
                  onClick={handleDelete}
                  className="w-full border border-red-900/50 text-red-500 bg-red-950/20 hover:bg-red-900/40 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Delete Tournament
                </button>
              </>
            ) : (
              <>
                {/* Non-creators see this waiting message */}
                <div className="w-full text-center py-3 bg-neutral-900 text-blue-500 rounded-lg border border-blue-900/30 text-sm font-medium flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Waiting for host to start the tournament...
                </div>

                {/* Leave Button */}
                <button
                  onClick={handleLeave}
                  className="w-full border border-neutral-700 text-neutral-400 bg-neutral-900/50 hover:bg-neutral-800 hover:text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  Leave Tournament
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* --- CLEAN VERTICAL TOURNAMENT LIST --- */
        <div className="flex-1 w-full max-w-3xl mx-auto py-8 px-4">
          {bracketData.map((round) => (
            <div key={round.title} className="mb-8 bg-[#0a0a0a] border border-neutral-900 rounded-xl overflow-hidden shadow-lg">
              
              {/* Round Header */}
              <div className="bg-neutral-900/50 px-6 py-3 border-b border-neutral-900">
                <h3 className="text-sm font-bold text-purple-500 uppercase tracking-widest">{round.title}</h3>
              </div>

              {/* Match List */}
              <div className="divide-y divide-neutral-900/50">
                {round.matches.map((match: any) => (
                  <div key={match.id} className="p-6 flex items-center justify-between hover:bg-neutral-900/20 transition-colors">
                    
                    {/* The Players */}
                    <div className="flex items-center gap-6 text-lg">
                      <span className={clsx("font-medium", match.winnerId === match.p1Id ? "text-green-500 font-bold" : "text-neutral-300")}>
                        {match.p1}
                      </span>
                      <span className="text-neutral-700 text-xs font-bold px-2">VS</span>
                      <span className={clsx("font-medium", match.winnerId === match.p2Id ? "text-green-500 font-bold" : "text-neutral-300")}>
                        {match.p2}
                      </span>
                    </div>

                    {/* The Result */}
                    <div className="text-sm font-mono flex items-center gap-2">
                      {match.winner ? (
                        <span className="bg-green-950/30 text-green-500 border border-green-900/50 px-3 py-1 rounded-md">
                          Winner: {match.winner}
                        </span>
                      ) : (
                        <span className="bg-neutral-900 text-neutral-500 border border-neutral-800 px-3 py-1 rounded-md">
                          Waiting / Ongoing
                        </span>
                      )}
                    </div>
                  
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
