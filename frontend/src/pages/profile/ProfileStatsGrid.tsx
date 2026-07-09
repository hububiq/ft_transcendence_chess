import { stats } from "./utils/constants";
import { Card, CardContent } from "../../components/card";
import clsx from "clsx";
import type { UserData } from "../../utils/interfaces";

interface StatsGridProps {
  user: UserData;
}

/* Stats Grid */
export function StatsGrid({ user }: StatsGridProps) {
  return (
    <>
      {stats.map((stat) => (
        <Card key={stat.id} className="bg-[#0a0a0a] border-neutral-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={clsx("w-8 h-8", stat.color)} />
            </div>
            <div key={stat.id} className="text-3xl font-bold text-white mb-1">
              {stat.label === "Total Games" && user?.profile?.total_games}
              {stat.label === "Current Streak" && user?.profile?.current_streak}
              {stat.label === "Peak Rating" && user?.profile?.peak_rating}
            </div>
            <div className="text-xs text-neutral-500 uppercase tracking-wide">
              {stat.label}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
