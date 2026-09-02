import { MatchHistory } from "../../features/statistics/MatchHistory";
import { StatisticsAchievements } from "../../features/statistics/StatisticsAchievements";
import { StatisticsSummary } from "../../features/statistics/StatisticsSummary";
import { useStatisticsHistory } from "../../features/statistics/hooks/useStatisticsHistory";
import { useStatisticsSummary } from "../../features/statistics/hooks/useStatisticsSummary";


export function Statistics() {
  const {
    user,
    isLoading: isSummaryLoading,
    errorMessage: summaryError,
    tournamentsWon,
  } = useStatisticsSummary();

  const {
    matches,
    isLoading: isHistoryLoading,
    errorMessage: historyError,
  } = useStatisticsHistory();


  if (isSummaryLoading) {
    return (
      <div className="p-8 text-center text-neutral-500">
        Loading statistics...
      </div>
    );
  }


  if (!user || summaryError) {
    return (
      <div className="p-8 text-center text-red-400">
        {summaryError ??
          "Statistics could not be loaded"}
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Statistics
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Your game results and progress
        </p>
      </header>

      <StatisticsSummary
        user={user}
        tournamentsWon={tournamentsWon}
      />
      
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <MatchHistory
            username={user.username}
            matches={matches}
            isLoading={isHistoryLoading}
            errorMessage={historyError}
        />

        <StatisticsAchievements
            user={user}
            tournamentsWon={tournamentsWon}
        />
        </div>
    </div>
  );
}