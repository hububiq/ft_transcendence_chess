import { Clock } from "lucide-react";
import clsx from "clsx";

export interface Match {
  id: string | number;
  result: "Win" | "Loss";
  opponent: string;
  type: string;
  date: string;
  eloChange: string;
}

interface MatchHistoryProps {
  history: Match[];
}

export function MatchHistory({ history }: MatchHistoryProps) {
  return (
    <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          Recent Matches
        </h3>
      </div>

      <div className="space-y-2">
        {history.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-4">No recent matches found.</p>
        ) : (
          history.map((match) => (
            <div
              key={match.id}
              className="flex items-center justify-between p-3 rounded-lg bg-black border border-neutral-900 hover:border-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={clsx(
                    "w-1 h-8 rounded-full",
                    match.result === "Win" ? "bg-green-500" : "bg-red-500"
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
                    match.result === "Win" ? "text-green-500" : "text-red-500"
                  )}
                >
                  {match.result}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {match.eloChange}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}