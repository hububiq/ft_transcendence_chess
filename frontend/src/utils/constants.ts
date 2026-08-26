import { Zap, Trophy, Shield, Star, Award } from "lucide-react";

export const USER_REGEX = /^(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9_-]{3,23}$/;
export const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9]{8,24}$/;

export type GameOutcome = "win" | "loss" | "draw";

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

export const achievements = [
  {
    id: 1,
    name: "Speed Demon",
    description: "Win 100 bullet games",
    icon: Zap,
    unlocked: true,
    rarity: "rare",
  },
  {
    id: 2,
    name: "Tournament Victor",
    description: "Win a tournament with 50+ players",
    icon: Trophy,
    unlocked: true,
    rarity: "epic",
  },
  {
    id: 3,
    name: "Comeback King",
    description: "Win a game from a -5 disadvantage",
    icon: Shield,
    unlocked: true,
    rarity: "rare",
  },
  {
    id: 4,
    name: "Perfectionist",
    description: "Win a game with 95%+ accuracy",
    icon: Star,
    unlocked: false,
    rarity: "legendary",
  },
  {
    id: 5,
    name: "Marathon Player",
    description: "Play 1000 games",
    icon: Award,
    unlocked: true,
    rarity: "common",
  },
];
