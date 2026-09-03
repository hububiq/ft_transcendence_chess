import { Link } from "react-router";
import { Trophy, ChevronRight } from "lucide-react";

export function ActiveTournaments() {
  return (
    <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-purple-500" />
          Active Tournaments
        </h3>
        <Link
          to="/tournament"
          className="text-xs font-medium text-blue-500 hover:text-blue-400 flex items-center"
        >
          View All <ChevronRight className="w-3 h-3 ml-1" />
        </Link>
      </div>

      <div className="space-y-3">
        <div className="bg-black border border-neutral-900 rounded-lg p-4 hover:border-purple-500/30 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">
                Weekend Blitz Arena
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Starts in 2 hours
              </p>
            </div>
            <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] px-2 py-1 rounded font-semibold uppercase tracking-wider">
              1000 Pts
            </span>
          </div>
          <div className="flex -space-x-2 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] text-neutral-500 font-medium"
              >
                {i}
              </div>
            ))}
            <div className="w-7 h-7 rounded-full bg-[#050505] border border-neutral-800 flex items-center justify-center text-[10px] text-neutral-400 font-medium">
              +42
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}