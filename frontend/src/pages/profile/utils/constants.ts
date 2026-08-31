import {
  Swords,
  TrendingUp,
  Crown,
  Trophy,
} from "lucide-react";

export const stats = [
  {
    id: 0,
    label: "Total Games",
    icon: Swords,
    color: "text-blue-500",
  },
  // { label: "Win Rate", value: "71.5%", icon: Target, color: "text-green-500" },
  {
    id: 1,
    label: "Current Streak",
    icon: TrendingUp,
    color: "text-purple-500",
  },
  {
    id: 2,
    label: "Peak Rating",
    icon: Crown,
    color: "text-yellow-500",
  },
  {
    id: 3,
    label: "Tournaments Won",
    icon: Trophy,
    color: "text-orange-500",
  },
];


 export const matchHistory = [
  {
    id: 1,
    opponent: "ChessMaster99",
    result: "Win",
    eloChange: "+12",
    date: "2 hrs ago",
    type: "Blitz 3|0",
    opening: "Sicilian Defense",
  },
  {
    id: 2,
    opponent: "KnightRider",
    result: "Loss",
    eloChange: "-9",
    date: "5 hrs ago",
    type: "Rapid 10|0",
    opening: "Queen's Gambit",
  },
  {
    id: 3,
    opponent: "QueenGambit",
    result: "Win",
    eloChange: "+15",
    date: "1 day ago",
    type: "Bullet 1|0",
    opening: "King's Indian",
  },
  {
    id: 4,
    opponent: "RookMaster",
    result: "Win",
    eloChange: "+11",
    date: "1 day ago",
    type: "Blitz 5|0",
    opening: "French Defense",
  },
  {
    id: 5,
    opponent: "PawnStorm",
    result: "Draw",
    eloChange: "0",
    date: "2 days ago",
    type: "Classical 15|10",
    opening: "English Opening",
  },
];
