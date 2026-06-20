import { useState } from "react";

export type Difficulty = "easy" | "medium" | "hard" | "master";

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; elo: number; color: string; delay: number }
> = {
  easy: { label: "Easy", elo: 800, color: "text-green-500", delay: 1200 },
  medium: { label: "Medium", elo: 1400, color: "text-yellow-500", delay: 800 },
  hard: { label: "Hard", elo: 1900, color: "text-orange-500", delay: 500 },
  master: { label: "Master", elo: 2400, color: "text-red-500", delay: 200 },
};

export const PIECE_SYMBOLS: Record<string, string> = {
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
  p: "♟",
  R: "♖",
  N: "♘",
  B: "♗",
  Q: "♕",
  K: "♔",
  P: "♙",
};

export const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;