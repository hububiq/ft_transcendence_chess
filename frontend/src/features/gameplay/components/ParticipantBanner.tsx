import type { ReactNode } from "react";
import { formatTime } from "../../../utils/constants";
import clsx from "clsx";

interface ParticipantBannerProps {
  avatar: ReactNode;
  name?: string;
  nameColor?: string; //eg "text-blue-500"
  eloRating?: number | string; //eg "Easy (800)" or "(2150)"
  eloRatingColor?: string; //eg "text-green-500"
  time?: number;
  isThinking?: boolean;
  graveyard?: ReactNode;
}

export function ParticipantBanner({
  avatar,
  name,
  nameColor = "text-white",
  eloRating,
  eloRatingColor = "text-neutral-500",
  time,
  isThinking = false,
  graveyard,
}: ParticipantBannerProps) {
  return (
    <div className="flex justify-between items-end">
      <div className="flex items-center gap-4">
        <div
          className={clsx(
            "w-12 h-12 rounded-lg border flex items-center justify-center text-2xl transition-all",
            isThinking
              ? "border-purple-500/50 bg-purple-500/10"
              : "border-neutral-800 bg-neutral-900",
          )}
        >
          <div
            className={clsx(
              isThinking ? "text-purple-400 animate-pulse" : { eloRatingColor },
            )}
          >
            {avatar}
          </div>
        </div>
        <div>
          <h3 className={clsx("font-semibold text-lg", nameColor)}>
            {name}{" "}
            <span className={clsx("text-sm font-normal", eloRatingColor)}>
              {eloRating}
            </span>
          </h3>
          {isThinking ? (
            <p className="text-xs text-purple-400 animate-pulse mt-0.5">
              Thinking…
            </p>
          ) : (
            <div className="flex gap-1 text-neutral-600 text-lg">
              {graveyard}
            </div>
          )}
        </div>
      </div>
      <div
        className={clsx(
          "border px-6 py-2 rounded-lg font-mono text-2xl font-bold transition-all",
          isThinking
            ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.1)]"
            : "bg-[#050505] border-neutral-900 text-neutral-300",
        )}
      >
        {time !== undefined ? formatTime(time) : "∞"}
      </div>
    </div>
  );
}
