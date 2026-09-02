import { clsx } from "clsx";

// import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/Card";

export interface Match {
  id: string;
  opponent: string;
  type: string;
  date: string;
  result: "Win" | "Loss" | "Draw";
  eloChange: string;
  opening: string;
}

interface MatchHistoryProps {
  matchHistory?: Match[];
}

export function MatchHistory({ matchHistory = [] }: MatchHistoryProps) {
  return (
    <div className="lg:col-span-2">
      {/* <Card className="bg-[#0a0a0a] border-neutral-900">
        <CardHeader>
          <CardTitle className="text-white">Match History</CardTitle>
          <CardDescription className="text-neutral-500">
            Your recent game results
          </CardDescription>
        </CardHeader>
        <CardContent> */}
          <div className="space-y-3">
            {matchHistory.map((match) => (
              <div
                key={match.id}
                className="bg-black border border-neutral-900 rounded-lg p-4 hover:border-neutral-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div
                      className={clsx(
                        "w-1.5 h-12 rounded-full",
                        match.result === "Win"
                          ? "bg-green-500"
                          : match.result === "Loss"
                            ? "bg-red-500"
                            : "bg-neutral-600",
                      )}
                    />
                    <div>
                      <p className="text-sm font-semibold text-neutral-200">
                        {match.opponent}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        {match.type} • {match.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={clsx(
                        "text-sm font-bold mb-1",
                        match.result === "Win"
                          ? "text-green-500"
                          : match.result === "Loss"
                            ? "text-red-500"
                            : "text-neutral-400",
                      )}
                    >
                      {match.result}
                    </p>
                    <p
                      className={clsx(
                        "text-xs font-medium",
                        match.eloChange.startsWith("+")
                          ? "text-green-500"
                          : match.eloChange === "0"
                            ? "text-neutral-500"
                            : "text-red-500",
                      )}
                    >
                      {match.eloChange}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <div className="text-[10px] text-neutral-600 uppercase tracking-wider">
                    Opening:
                  </div>
                  <div className="text-xs text-neutral-400">
                    {match.opening}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 bg-transparent hover:bg-neutral-900 text-neutral-400 hover:text-white font-medium py-2.5 px-6 rounded-lg border border-neutral-800 transition-colors text-sm">
            View All Matches
          </button>
        {/* </CardContent>
      </Card> */}
    </div>
  );
}