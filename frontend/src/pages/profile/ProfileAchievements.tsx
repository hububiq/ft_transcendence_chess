import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/card";
import clsx from "clsx";
import { achievements } from "../../utils/constants";

export function Achievements() {

    return (
  <>
    <Card className="bg-[#0a0a0a] border-neutral-900">
      <CardHeader>
        <CardTitle className="text-white">Achievements</CardTitle>
        <CardDescription className="text-neutral-500">
          Unlock badges by completing challenges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={clsx(
                "bg-black border rounded-lg p-4 transition-colors",
                achievement.unlocked
                  ? "border-neutral-900 hover:border-neutral-700 cursor-pointer"
                  : "border-neutral-900/50 opacity-50",
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={clsx(
                    "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                    achievement.unlocked
                      ? achievement.rarity === "legendary"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : achievement.rarity === "epic"
                          ? "bg-purple-500/10 text-purple-500"
                          : achievement.rarity === "rare"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-green-500/10 text-green-500"
                      : "bg-neutral-900 text-neutral-600",
                  )}
                >
                  <achievement.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {achievement.name}
                  </h4>
                  <p className="text-xs text-neutral-500">
                    {achievement.description}
                  </p>
                  {achievement.unlocked && (
                    <div
                      className={clsx(
                        "text-[10px] uppercase tracking-wider font-bold mt-2",
                        achievement.rarity === "legendary"
                          ? "text-yellow-500"
                          : achievement.rarity === "epic"
                            ? "text-purple-500"
                            : achievement.rarity === "rare"
                              ? "text-blue-500"
                              : "text-green-500",
                      )}
                    >
                      {achievement.rarity}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </>
  );
}
