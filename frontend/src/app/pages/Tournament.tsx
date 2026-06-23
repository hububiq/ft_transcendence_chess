import { Trophy } from "lucide-react";
import clsx from "clsx";

const rounds = [
  {
    title: "Quarterfinals",
    matches: [
      { id: 1, p1: "GrandMaster99", p2: "ChessKing", p1Score: 1, p2Score: 0, isCurrent: true, winner: "GrandMaster99" },
      { id: 2, p1: "KnightRider", p2: "PawnStorm", p1Score: 0, p2Score: 1, isCurrent: false, winner: "PawnStorm" },
      { id: 3, p1: "QueenGambit", p2: "RookSolid", p1Score: 1, p2Score: 0, isCurrent: false, winner: "QueenGambit" },
      { id: 4, p1: "BishopPro", p2: "EndgameGuru", p1Score: 0, p2Score: 1, isCurrent: false, winner: "EndgameGuru" },
    ]
  },
  {
    title: "Semifinals",
    matches: [
      { id: 5, p1: "GrandMaster99", p2: "PawnStorm", p1Score: null, p2Score: null, isCurrent: true },
      { id: 6, p1: "QueenGambit", p2: "EndgameGuru", p1Score: null, p2Score: null, isCurrent: false },
    ]
  },
  {
    title: "Finals",
    matches: [
      { id: 7, p1: "TBD", p2: "TBD", p1Score: null, p2Score: null, isCurrent: false },
    ]
  }
];

export function Tournament() {
  return (
    <div className="p-8 h-full flex flex-col max-w-7xl mx-auto">
      <div className="mb-10 flex items-center justify-between pt-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-purple-500" />
            Weekend Blitz Arena
          </h2>
          <p className="text-neutral-500 mt-2 text-sm">Single Elimination • 1000 Pts Prize Pool</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center py-10">
        <div className="flex gap-16 min-w-max mx-auto px-8">
          {rounds.map((round, rIndex) => (
            <div key={round.title} className="flex flex-col justify-around min-w-[260px]">
              <h3 className="text-center text-xs font-bold text-neutral-600 uppercase tracking-widest mb-8">
                {round.title}
              </h3>
              
              <div className="flex flex-col gap-8 flex-1 justify-around">
                {round.matches.map((match) => (
                  <div key={match.id} className="relative">
                    {/* Connector Lines */}
                    {rIndex < rounds.length - 1 && (
                      <div className="absolute top-1/2 -right-16 w-16 h-[1px] bg-neutral-800 pointer-events-none">
                        {match.id % 2 !== 0 && (
                          <div className="absolute right-0 top-0 w-[1px] h-[calc(50%+2rem)] bg-neutral-800" />
                        )}
                        {match.id % 2 === 0 && (
                          <div className="absolute right-0 bottom-0 w-[1px] h-[calc(50%+2rem)] bg-neutral-800" />
                        )}
                      </div>
                    )}
                    
                    <div className={clsx(
                      "bg-black border rounded-lg overflow-hidden flex flex-col shadow-2xl z-10 relative",
                      match.isCurrent ? "border-blue-500/50" : "border-neutral-900"
                    )}>
                      {/* Player 1 */}
                      <div className={clsx(
                        "flex justify-between items-center p-3 border-b border-neutral-900",
                        match.winner === match.p1 ? "bg-neutral-900/50" : "bg-black",
                        match.p1 === "GrandMaster99" ? "text-blue-400 font-medium" : "text-neutral-300"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] text-neutral-500">
                            {match.p1.charAt(0)}
                          </div>
                          <span className="text-sm">{match.p1}</span>
                        </div>
                        <span className="text-sm font-medium">{match.p1Score ?? '-'}</span>
                      </div>
                      
                      {/* Player 2 */}
                      <div className={clsx(
                        "flex justify-between items-center p-3",
                        match.winner === match.p2 ? "bg-neutral-900/50" : "bg-black",
                        match.p2 === "GrandMaster99" ? "text-blue-400 font-medium" : "text-neutral-300"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] text-neutral-500">
                            {match.p2.charAt(0)}
                          </div>
                          <span className="text-sm">{match.p2}</span>
                        </div>
                        <span className="text-sm font-medium">{match.p2Score ?? '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
