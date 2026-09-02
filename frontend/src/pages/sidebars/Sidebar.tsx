import { Link, useLocation } from "react-router";
import {
  BarChart3,
  Play,
  Trophy,
  User,
  LogOut,
  Palette,
} from "lucide-react";
import clsx from "clsx";
import { useUser } from "../../hooks/useUser";
import { useAuth } from "../../features/auth/context/AuthProvider";
import { resolveMediaUrl } from "../../utils/utils";
import playerAvatar from "../../assets/avatar_1.png";

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const { user } = useUser();

  const handleSignOut = () => {
    logout();
  };

  const navItems = [
    { name: "Play", path: "/", icon: Play },
    { name: "Tournaments", path: "/tournament", icon: Trophy },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Statistics", path: "/statistics", icon: BarChart3 },
    { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
    { name: "Design System", path: "/design-system", icon: Palette },
  ];

  return (
    <aside className="w-20 lg:w-64 transition-all duration-300 ease-in-out bg-[#050505] border-r border-neutral-900 flex flex-col justify-between h-full">
      <div>
        <div className="p-6 flex justify-center lg:justify-start">
          <h1 className="text-2xl font-bold tracking-wider text-white flex items-center gap-2">
            {
              <Link key="Play" to={"/"}>
                <span className="block lg:hidden text-2xl text-white">C42</span>
                <span className="hidden lg:block">Chess42</span>
              </Link>
            }
          </h1>
        </div>

        <nav className="px-3 lg:px-4 space-y-1.5 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  "flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 lg:py-3 rounded-lg transition-colors duration-200",
                  isActive
                    ? "bg-blue-600/10 text-blue-400"
                    : "text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200",
                )}
                title={item.name}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="hidden lg:block text-sm font-medium">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-2 lg:p-4 border-t border-neutral-900 flex flex-col items-center lg:items-stretch">
        <Link
          to="/profile"
          className="flex items-center justify-center lg:justify-start gap-3 mb-4 p-2 lg:p-3 rounded-lg bg-black border border-neutral-900 hover:border-neutral-700 transition-colors cursor-pointer w-full"
        >
          <img
            src={
             	resolveMediaUrl(user?.profile.avatar) ||
  				user?.profile.oauth_avatar_url ||
  				playerAvatar
            }
            alt="User Avatar"
            className="w-10 h-10 rounded-full border border-neutral-800 object-cover shrink-0"
          />

          <div className="hidden lg:block flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-200 truncate">
              {user?.username}
            </p>
            <p className="text-xs text-blue-500 font-semibold mt-0.5">
              ELO: {user?.profile?.elo_rating}
            </p>
          </div>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center lg:justify-start gap-3 w-full p-2 lg:px-4 lg:py-2 text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="hidden lg:block text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
