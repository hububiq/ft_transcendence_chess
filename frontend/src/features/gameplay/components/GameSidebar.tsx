import clsx from "clsx";
import { RotateCcw, Flag } from "lucide-react";
import { type Difficulty, DIFFICULTY_CONFIG } from "../../../utils/constants";

export type MoveRecord = {
  n: number;
  white: string;
  black?: string;
};

interface GameSidebarProps {
  difficulty: Difficulty;
  onRestart: () => void;
  onResign: () => void;
  moveHistory: MoveRecord[];
}

export function GameSidebar({
  difficulty,
  onRestart,
  onResign,
  moveHistory,
}: GameSidebarProps) {
  const cfg = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="w-72 bg-[#050505] border border-neutral-900 rounded-xl h-[600px] flex flex-col p-4">
      {/* Difficulty badge */}
      <div className="mb-4 pb-2 border-b border-neutral-900 flex items-center justify-between">
        <span className="text-[10px]  font-bold text-neutral-600 uppercase tracking-widest">
          Bot Difficulty
        </span>
        <span
          className={clsx(
            "text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-900",
            cfg.color,
          )}
        >
          {cfg.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h4 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-4">
          Move History
        </h4>
        <div className="space-y-1 text-sm font-mono">
          {moveHistory.length === 0 && (
            <p className="text-neutral-700 text-xs">No moves yet.</p>
          )}
          {moveHistory.map((m) => (
            <div
              key={m.n}
              className={clsx(
                "flex px-2 py-1.5 rounded",
                m.n % 2 === 1 ? "bg-neutral-900" : "",
              )}
            >
              <span className="w-8 text-neutral-500">{m.n}.</span>
              <span className="flex-1 text-neutral-300">{m.white}</span>
              <span className="flex-1 text-neutral-300">{m.black ?? ""}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-neutral-900 flex gap-2">
        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg transition-colors text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" /> Restart
        </button>
        <button
          onClick={onResign}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-950/30 hover:bg-red-900/40 text-red-500 border border-red-900/30 rounded-lg transition-colors text-sm font-medium"
        >
          <Flag className="w-4 h-4" /> Resign
        </button>
      </div>
    </div>
  );
}
