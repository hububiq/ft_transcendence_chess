import {
  Medal,
  Star,
  Trophy,
} from "lucide-react";

import type { UserData } from "../../utils/interfaces";


interface StatisticsAchievementsProps {
  user: UserData;
  tournamentsWon: number | null;
}


interface Achievement {
  id: string;
  title: string;
  description: string;
  current: number | null;
  target: number;
  icon: typeof Trophy;
}


function buildAchievements(
  user: UserData,
  tournamentsWon: number | null,
): Achievement[] {
  return [
    {
      id: "experienced-player",
      title: "Experienced Player",
      description: "Play 10 games",
      current: user.profile.total_games,
      target: 10,
      icon: Medal,
    },
    {
      id: "rating-climber",
      title: "Rating Climber",
      description: "Reach 1400 ELO",
      current: user.profile.peak_rating,
      target: 1400,
      icon: Star,
    },
    {
      id: "tournament-champion",
      title: "Tournament Champion",
      description: "Win a tournament",
      current: tournamentsWon,
      target: 1,
      icon: Trophy,
    },
  ];
}


function getProgressPercent(
  current: number,
  target: number,
): number {
  if (target <= 0) {
    return 100;
  }

  return Math.min(
    (current / target) * 100,
    100,
  );
}


function AchievementCard({
  achievement,
}: {
  achievement: Achievement;
}) {
  const hasProgress =
    achievement.current !== null;

  const isCompleted =
    hasProgress &&
    achievement.current >= achievement.target;

  const progress =
    hasProgress
      ? getProgressPercent(
          achievement.current,
          achievement.target,
        )
      : 0;

  const displayedProgress =
    hasProgress
      ? Math.min(
          achievement.current,
          achievement.target,
        )
      : null;

  const Icon = achievement.icon;

  return (
    <div
      className={[
        "rounded-xl border p-5 transition-opacity",
        isCompleted
          ? "border-neutral-800 bg-[#0a0a0a]"
          : "border-neutral-900 bg-[#080808] opacity-55",
      ].join(" ")}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-neutral-100">
            {achievement.title}
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            {achievement.description}
          </p>
        </div>

        <Icon
          className={[
            "h-5 w-5 shrink-0",
            isCompleted
              ? "text-neutral-200"
              : "text-neutral-600",
          ].join(" ")}
        />
      </div>

      <div className="mb-3 flex items-center justify-between">
        {isCompleted ? (
          <span className="text-sm font-medium text-neutral-200">
            Completed ✓
          </span>
        ) : hasProgress ? (
          <span className="text-sm font-medium text-neutral-400">
            {displayedProgress} /{" "}
            {achievement.target}
          </span>
        ) : (
          <span className="text-sm text-neutral-600">
            Unavailable
          </span>
        )}
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-neutral-900">
        <div
          className="h-full rounded-full bg-neutral-400 transition-[width]"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}


export function StatisticsAchievements({
  user,
  tournamentsWon,
}: StatisticsAchievementsProps) {
  const achievements =
    buildAchievements(
      user,
      tournamentsWon,
    );

  return (
    <aside>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">
          Achievements
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Your current progression
        </p>
      </div>

      <div className="space-y-4">
        {achievements.map(
          (achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
            />
          ),
        )}
      </div>
    </aside>
  );
}