import { Link, useNavigate } from "react-router";
import { Swords, Bot, Loader2, ServerOff } from "lucide-react";
import { useMatchmaking } from "../../hooks/useMatchmaking";
import { useUser } from "../../hooks/useUser";
import { useActiveGame } from "../../hooks/useActiveGame";

// Future imports:
// import { ActiveTournaments } from "./ActiveTournaments";
// import { MatchHistory } from "./MatchHistory";

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
    <div className="p-8 max-w-5xl mx-auto space-y-8">
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
        {/* <ActiveTournaments />
          <MatchHistory history={[]} />  */}
      </div>
    </div>
  );
}
