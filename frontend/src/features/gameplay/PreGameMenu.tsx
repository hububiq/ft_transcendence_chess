import { useState } from "react";
import { Bot, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { DIFFICULTY_CONFIG } from "../../utils/constants";
import type { Difficulty } from "../../utils/constants";

interface PreGameMenuProps {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onStartGame: () => void;
  timeMode: boolean;
  onTimeModeChange: (timeMode: boolean) => void;
}

export function PreGameMenu({
  difficulty,
  onDifficultyChange,
  onStartGame,
  timeMode,
  onTimeModeChange,
}: PreGameMenuProps) {
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const cfg = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="bg-[#080808] border border-neutral-800 rounded-2xl p-10 w-full max-w-md flex flex-col items-center text-center gap-8">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Bot className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Play vs Bot</h2>
          <p className="text-neutral-500 text-sm">
            Choose your opponent difficulty and start the game.
          </p>
        </div>

        {/* Difficulty selector */}
        <div className="w-full relative">
          <button
            onClick={() => setShowDifficultyMenu((v) => !v)}
            className="w-full flex items-center justify-between bg-black border border-neutral-800 hover:border-neutral-700 rounded-lg px-4 py-3 text-sm font-medium transition-colors"
          >
            <span className="flex items-center gap-3">
              <span
                className={clsx("w-2 h-2 rounded-full", {
                  "bg-green-500": difficulty === "easy",
                  "bg-yellow-500": difficulty === "medium",
                  "bg-orange-500": difficulty === "hard",
                  "bg-red-500": difficulty === "master",
                })}
              />
              <span className="text-white">Play {cfg.label}</span>
              <span className="text-neutral-500">({cfg.elo} ELO)</span>
            </span>
            <ChevronDown
              className={clsx(
                "w-4 h-4 text-neutral-500 transition-transform",
                showDifficultyMenu && "rotate-180",
              )}
            />
          </button>

          {showDifficultyMenu && (
            <div className="absolute top-full mt-1 w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg overflow-hidden z-10 shadow-2xl">
              {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    onDifficultyChange(lvl);
                    setShowDifficultyMenu(false);
                  }}
                  className={clsx(
                    "w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-900 transition-colors",
                    difficulty === lvl ? "bg-neutral-900" : "", // Parent's state === this button's ID
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={clsx("w-2 h-2 rounded-full", {
                        "bg-green-500": lvl === "easy",
                        "bg-yellow-500": lvl === "medium",
                        "bg-orange-500": lvl === "hard",
                        "bg-red-500": lvl === "master",
                      })}
                    />
                    <span className="text-white">
                      {DIFFICULTY_CONFIG[lvl].label}
                    </span>
                  </span>
                  <span className="text-neutral-500 text-xs">
                    {DIFFICULTY_CONFIG[lvl].elo} ELO
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onTimeModeChange(!timeMode)}
          className={clsx(
            "w-full py-3 px-4 rounded-xl border flex items-center justify-between text-sm font-medium transition-all",
            timeMode
              ? "bg-purple-950/20 border-purple-500/30 text-purple-300"
              : "bg-neutral-900 border-neutral-800 text-neutral-400",
          )}
        >
          <span className="flex items-center gap-2">
            <span>⏱️</span> Blitz Clock (10:00)
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-black">
            {timeMode ? "ON" : "OFF"}
          </span>
        </button>

        <button
          onClick={onStartGame}
          className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all hover:shadow-[0_0_20px_rgba(147,51,234,0.25)]"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
