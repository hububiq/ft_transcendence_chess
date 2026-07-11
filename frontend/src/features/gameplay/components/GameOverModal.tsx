import { Link } from "react-router";
import { RotateCcw } from "lucide-react";
import clsx from "clsx";
import {
  type Difficulty,
  type GameOutcome,
  DIFFICULTY_CONFIG,
} from "../../../utils/constants";

interface GameOverModalProps {
  outcome: GameOutcome;
  difficulty: Difficulty;
  onRestart: () => void;
}

export function GameOverModal({
  outcome,
  difficulty,
  onRestart,
}: GameOverModalProps) {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const OUTCOMES: Record<
    GameOutcome,
    { icon: string; title: string; desc: string }
  > = {
    win: {
      icon: "♔",
      title: "You Won!",
      desc: "Excelent play against bot.",
    },
    loss: {
      icon: "♚",
      title: "You Lost",
      desc: `Better luck next time against ${cfg.label} bot.`,
    },
    draw: {
      icon: "½",
      title: "Draw",
      desc: "The game is draw.", // idea for future updates, to recognize which type of draw
    },
  };

  const { icon, title, desc } = OUTCOMES[outcome];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#080808] border border-neutral-800 rounded-2xl p-10 w-full max-w-sm text-center flex flex-col items-center gap-6">
        <div
          className={clsx(
            "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl",
            outcome === "win" &&
              "bg-green-500/10 border border-green-500/20 text-green-500",
            outcome === "loss" &&
              "bg-red-500/10 border border-red-500/20 text-red-500",
            outcome === "draw" &&
              "bg-neutral-500/10 border border-neutral-500/20 text-neutral-400",
          )}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
          <p className="text-neutral-500 text-sm">{desc}</p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Rematch
          </button>
          <Link
            to="/"
            className="flex-1 flex items-center justify-center py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
