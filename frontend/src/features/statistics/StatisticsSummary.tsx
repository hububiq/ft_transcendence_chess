import {
  CircleCheck,
  CircleX,
  Crown,
  Gamepad2,
  Minus,
  Percent,
  TrendingUp,
  Trophy,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "../../components/card";
import type { UserData } from "../../utils/interfaces";


interface StatisticsSummaryProps {
  user: UserData;
  tournamentsWon: number | null;
}


interface SummaryItem {
  id: string;
  label: string;
  value: string | number;
  icon: typeof Crown;
}


function calculateWinRate(
  wins: number,
  totalGames: number,
): string {
  if (totalGames === 0) {
    return "0%";
  }

  return `${(
    (wins / totalGames) *
    100
  ).toFixed(1)}%`;
}


function buildSummaryItems(
  user: UserData,
  tournamentsWon: number | null,
): SummaryItem[] {
  const { profile } = user;

  return [
    {
      id: "current-elo",
      label: "Current ELO",
      value: profile.elo_rating,
      icon: Crown,
    },
    {
      id: "peak-elo",
      label: "Peak ELO",
      value: profile.peak_rating,
      icon: TrendingUp,
    },
    {
      id: "games",
      label: "Games Played",
      value: profile.total_games,
      icon: Gamepad2,
    },
    {
      id: "wins",
      label: "Wins",
      value: profile.wins,
      icon: CircleCheck,
    },
    {
      id: "losses",
      label: "Losses",
      value: profile.losses,
      icon: CircleX,
    },
    {
      id: "draws",
      label: "Draws",
      value: profile.draws,
      icon: Minus,
    },
    {
      id: "win-rate",
      label: "Win Rate",
      value: calculateWinRate(
        profile.wins,
        profile.total_games,
      ),
      icon: Percent,
    },
    {
      id: "tournaments",
      label: "Tournament Wins",
      value: tournamentsWon ?? "—",
      icon: Trophy,
    },
  ];
}


export function StatisticsSummary({
  user,
  tournamentsWon,
}: StatisticsSummaryProps) {
  const summaryItems = buildSummaryItems(
    user,
    tournamentsWon,
  );

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-white">
        Summary
      </h2>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {summaryItems.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.id}
              className="gap-0 border-neutral-900 bg-[#0a0a0a]"
            >
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <Icon className="h-5 w-5 text-neutral-500" />
                </div>

                <p className="text-2xl font-bold text-white">
                  {item.value}
                </p>

                <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
                  {item.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}