import { LeaderboardTable } from "../../features/statistics/LeaderboardTable";
import { useLeaderboard } from "../../features/statistics/hooks/useLeaderboard";
import { Medal } from "lucide-react";
import { Link } from "react-router";

export function Leaderboard() {
  const {
    topPlayers,
    currentUser,
    isLoading,
    errorMessage,
  } = useLeaderboard();


  if (isLoading) {
    return (
      <div className="p-8 text-center text-neutral-500">
        Loading leaderboard...
      </div>
    );
  }


  if (errorMessage) {
    return (
      <div className="p-8 text-center text-red-400">
        {errorMessage}
      </div>
    );
  }


  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
          <Medal className="h-8 w-8 shrink-0 text-purple-500" />
          Leaderboard
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Top 10 players by ELO rating
        </p>
      </header>

      {topPlayers.length === 0 ? (
        <div className="rounded-xl border border-neutral-900 bg-[#0a0a0a] p-6 text-sm text-neutral-500">
          No ranked players yet.
        </div>
      ) : (
        <LeaderboardTable
          topPlayers={topPlayers}
          currentUser={currentUser}
        />
      )}
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