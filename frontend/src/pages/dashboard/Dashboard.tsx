import { Link, useNavigate } from "react-router";
import { Swords, Bot, Loader2, ServerOff } from "lucide-react";
import { useMatchmaking } from "../../hooks/useMatchmaking";
import { useUser } from "../../hooks/useUser";
import { useActiveGame } from "../../hooks/useActiveGame";

export function Dashboard() {
  const { user, loading, error } = useUser();
  const navigate = useNavigate();

  const {
    activeGame,
    isLoading: isActiveGameLoading,
    errorMessage: activeGameErrorMessage,
  } = useActiveGame();

  // init hook
  const { isSearching, joinQueue, cancelQueue } = useMatchmaking(
    user?.id,
    user?.profile?.elo_rating,
  );

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto flex flex-col gap-8">
      {/* Header Area */}
      <div className="flex items-center justify-between pt-4">
        <div>
          {!loading && !error && (
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Welcome back, {user?.username}
            </h2>
          )}
          {error && (
            <h2 className="text-3xl font-bold text-white tracking-tight">
              <ServerOff />
            </h2>
          )}
          <p className="text-neutral-500 mt-1.5 text-sm">
            Ready for your next challenge?
          </p>
        </div>
      </div>

      {/* Main Action Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-neutral-800 p-6 sm:p-10 flex flex-col items-center justify-center text-center">
        <Swords className="w-12 h-12 text-blue-500 mb-6 relative z-10" />
        <h3 className="text-2xl font-bold text-white mb-4 relative z-10">
          {activeGame ? "Game in Progress" : "Find a Match"}
        </h3>

        <p
          className={`text-neutral-400 mb-8 max-w-md relative z-10 text-base leading-relaxed`}
        >
          {activeGame
            ? "You already have an active game. Return to continue playing."
            : "Join our matchmaking queue to tackle random opponen or try to outsmart AI"}
        </p>

        {/* redundant code */}
        {/* {!activeGame && (
          <p className="text-neutral-400 mb-8 max-w-md relative z-10 text-base leading-relaxed">
            or try to outsmart AI
          </p>
        )} */}

        <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-xs lg:max-w-none justify-center gap-3">
          {isActiveGameLoading ? (
            <button
              type="button"
              disabled
              className="flex items-center justify-center gap-2 bg-neutral-800 text-neutral-400 font-medium py-3 px-8 rounded-lg cursor-not-allowed"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              Checking Game...
            </button>
          ) : activeGame ? (
            <button
              type="button"
              onClick={() => {
                // Return directly to the existing game without starting matchmaking
                navigate(`/game/${activeGame.game_id}`);
              }}
              className="bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-8 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(22,163,74,0.2)]"
            >
              Return to Game
            </button>
          ) : activeGameErrorMessage ? (
            <button
              type="button"
              disabled
              className="flex items-center justify-center gap-2 bg-neutral-800 text-neutral-500 font-medium py-3 px-8 rounded-lg cursor-not-allowed"
            >
              <ServerOff className="w-5 h-5" />
              Game Status Unavailable
            </button>
          ) : isSearching ? (
            <button
              onClick={cancelQueue}
              className="flex items-center justify-center w-full lg:w-auto gap-2 bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-8 rounded-lg transition-all"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              Cancel Search...
            </button>
          ) : (
            <button
              onClick={joinQueue}
              className="w-full lg:w-auto bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.2)]"
            >
              Play Now
            </button>
          )}

          <Link
            to="/bot"
            className="flex items-center justify-center w-full lg:w-auto gap-2 bg-[#0d0d0d] hover:bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 hover:border-purple-500/40 font-medium py-3 px-8 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(147,51,234,0.1)]"
          >
            <Bot className="w-4 h-4 text-purple-400" />
            Play vs Bot
          </Link>
        </div>
      </div>

      {/* Grid Layout for Tournaments & History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Tournaments */}
        {/* <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-500" />
              Active Tournaments
            </h3>
            <Link
              to="/tournament"
              className="text-xs font-medium text-blue-500 hover:text-blue-400 flex items-center"
            >
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="bg-black border border-neutral-900 rounded-lg p-4 hover:border-purple-500/30 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">
                    Weekend Blitz Arena
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    Starts in 2 hours
                  </p>
                </div>
                <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] px-2 py-1 rounded font-semibold uppercase tracking-wider">
                  1000 Pts
                </span>
              </div>
              <div className="flex -space-x-2 mt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] text-neutral-500 font-medium"
                  >
                    {i}
                  </div>
                ))}
                <div className="w-7 h-7 rounded-full bg-[#050505] border border-neutral-800 flex items-center justify-center text-[10px] text-neutral-400 font-medium">
                  +42
                </div>
              </div>
            </div>
          </div>
        </div> */}

        {/* Match History */}
        {/* <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Recent Matches
            </h3>
          </div>

          <div className="space-y-2">
            {matchHistory.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-3 rounded-lg bg-black border border-neutral-900 hover:border-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={clsx(
                      "w-1 h-8 rounded-full",
                      match.result === "Win" ? "bg-green-500" : "bg-red-500",
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-300">
                      {match.opponent}
                    </p>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      {match.type} • {match.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={clsx(
                      "text-sm font-semibold",
                      match.result === "Win"
                        ? "text-green-500"
                        : "text-red-500",
                    )}
                  >
                    {match.result}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {match.eloChange}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div> */}
      </div>
      {/* Footer Links */}
      <div className="mt-auto flex justify-center items-center gap-4 pt-8 pb-2 text-sm text-neutral-700">
        <Link
          to="/terms"
          className="hover:text-white transition-colors"
        >
          Terms of Service
        </Link>

        <span className="text-neutral-700">•</span>

        <Link
          to="/privacy"
          className="hover:text-white transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
