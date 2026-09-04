import { LeaderboardTable } from "../../features/statistics/LeaderboardTable";
import { useLeaderboard } from "../../features/statistics/hooks/useLeaderboard";
import { Medal } from "lucide-react";

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
    <div className="mx-auto max-w-6xl space-y-8 p-8">
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
    </div>
  );
}