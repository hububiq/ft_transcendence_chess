import {
  Crown,
  Trophy,
  Target,
  TrendingUp,
  Swords,
  Calendar,
  Mail,
  MapPin,
  Award,
  Star,
  Zap,
  Shield,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import clsx from "clsx";
import { useEffect, useState } from "react";
import axios from "axios";

const stats = [
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
];

const matchHistory = [
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

const achievements = [
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

interface UserData {
  username: string;
  email: string;
  date_joined: string;
  profile: {
    avatar: string;
    bio: string;
    current_streak: number;
    elo_rating: number;
    location: string;
    peak_rating: number;
    total_games: number;
  };
}

const token = localStorage.getItem("access_token");

export function Profile() {
  const [items, setItems] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setError("");
        const response = await axios.get("http://localhost:8000/api/me/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setItems(response.data);
      } catch (error) {
        setError(`Profile: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-[#0a0a0a] border border-neutral-900 rounded-xl p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200"
            alt="Profile Avatar"
            className="w-24 h-24 rounded-full border-4 border-blue-600/20 object-cover"
          />

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
              {!loading && (
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {items?.username}
                </h1>
              )}
              <div className="flex items-center gap-2">
                <div className="bg-blue-600/10 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                  <Crown className="w-4 h-4" />
                  ELO: {items?.profile?.elo_rating}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400 mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {items?.email}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                *Warsaw, Poland
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                *Joined January 2024
              </div>
            </div>

            <p className="text-neutral-300 text-sm max-w-2xl">
              {items?.profile?.bio}
            </p>
          </div>

          <button className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 px-6 rounded-lg border border-neutral-800 transition-colors">
            *Edit Profile
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card className="bg-[#0a0a0a] border-neutral-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={clsx("w-8 h-8", stat.color)} />
              </div>
              <div key={stat.id} className="text-3xl font-bold text-white mb-1">
                {stat.label === "Total Games" && items?.profile?.total_games}
                {stat.label === "Current Streak" &&
                  items?.profile?.current_streak}
                {stat.label === "Peak Rating" && items?.profile?.peak_rating}
              </div>
              <div className="text-xs text-neutral-500 uppercase tracking-wide">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match History - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card className="bg-[#0a0a0a] border-neutral-900">
            <CardHeader>
              <CardTitle className="text-white">Match History</CardTitle>
              <CardDescription className="text-neutral-500">
                Your recent game results
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Rating Progress - Takes 1 column */}
        <div className="space-y-6">
          <Card className="bg-[#0a0a0a] border-neutral-900">
            <CardHeader>
              <CardTitle className="text-white">Rating Progress</CardTitle>
              <CardDescription className="text-neutral-500">
                Last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs text-neutral-500 uppercase tracking-wide">
                      Bullet
                    </span>
                    <span className="text-lg font-bold text-white">1,987</span>
                  </div>
                  <div className="w-full bg-black rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-blue-500 h-full"
                      style={{ width: "78%" }}
                    />
                  </div>
                  <div className="text-xs text-green-500 mt-1 font-medium">
                    +45 this month
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs text-neutral-500 uppercase tracking-wide">
                      Blitz
                    </span>
                    <span className="text-lg font-bold text-white">2,145</span>
                  </div>
                  <div className="w-full bg-black rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-purple-500 h-full"
                      style={{ width: "85%" }}
                    />
                  </div>
                  <div className="text-xs text-green-500 mt-1 font-medium">
                    +28 this month
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs text-neutral-500 uppercase tracking-wide">
                      Rapid
                    </span>
                    <span className="text-lg font-bold text-white">2,001</span>
                  </div>
                  <div className="w-full bg-black rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-600 to-green-500 h-full"
                      style={{ width: "82%" }}
                    />
                  </div>
                  <div className="text-xs text-red-500 mt-1 font-medium">
                    -12 this month
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Achievements */}
      <Card className="bg-[#0a0a0a] border-neutral-900">
        <CardHeader>
          <CardTitle className="text-white">Achievements</CardTitle>
          <CardDescription className="text-neutral-500">
            Unlock badges by completing challenges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={clsx(
                  "bg-black border rounded-lg p-4 transition-colors",
                  achievement.unlocked
                    ? "border-neutral-900 hover:border-neutral-700 cursor-pointer"
                    : "border-neutral-900/50 opacity-50",
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={clsx(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                      achievement.unlocked
                        ? achievement.rarity === "legendary"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : achievement.rarity === "epic"
                            ? "bg-purple-500/10 text-purple-500"
                            : achievement.rarity === "rare"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-green-500/10 text-green-500"
                        : "bg-neutral-900 text-neutral-600",
                    )}
                  >
                    <achievement.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white mb-1">
                      {achievement.name}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      {achievement.description}
                    </p>
                    {achievement.unlocked && (
                      <div
                        className={clsx(
                          "text-[10px] uppercase tracking-wider font-bold mt-2",
                          achievement.rarity === "legendary"
                            ? "text-yellow-500"
                            : achievement.rarity === "epic"
                              ? "text-purple-500"
                              : achievement.rarity === "rare"
                                ? "text-blue-500"
                                : "text-green-500",
                        )}
                      >
                        {achievement.rarity}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
