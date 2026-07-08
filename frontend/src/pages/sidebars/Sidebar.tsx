import { Link, useLocation } from "react-router";
import {
  Play,
  Trophy,
  User,
  Settings,
  LogOut,
  Palette,
  Loader,
} from "lucide-react";
import clsx from "clsx";
import axios from "axios";
import { useEffect, useState } from "react";
import { useUser } from "../../hooks/useUser";

// interface UserData {
//   username: string;
//   profile: {
//     elo_rating: number;
//   };
// }

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: "Play", path: "/", icon: Play },
    { name: "Tournaments", path: "/tournament", icon: Trophy },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Settings", path: "/settings", icon: Settings },
    { name: "Design System", path: "/design-system", icon: Palette },
  ];
  const { user, loading } = useUser();

  return (
    <aside className="w-64 bg-[#050505] border-r border-neutral-900 flex flex-col justify-between h-full">
      <div>
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider text-white flex items-center gap-2">
            {
              <Link key="Play" to={"/"}>
                Chess42
              </Link>
            }
          </h1>
        </div>

        <nav className="px-4 space-y-1.5 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-sm font-medium",
                  isActive
                    ? "bg-blue-600/10 text-blue-400"
                    : "text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200",
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-neutral-900">
        <Link
          to="/profile"
          className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-black border border-neutral-900 hover:border-neutral-700 transition-colors cursor-pointer"
        >
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150"
            alt="User Avatar"
            className="w-10 h-10 rounded-full border border-neutral-800 object-cover"
          />
          {loading ? (
            <Loader />
          ) : (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-200 truncate">
                {user?.username}
              </p>
              <p className="text-xs text-blue-500 font-semibold mt-0.5">
                ELO: {user?.profile?.elo_rating}
              </p>
            </div>
          )}
        </Link>
        <Link
          to="/login"
          className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Link>
      </div>
    </aside>
  );
}
