import { createBrowserRouter } from "react-router";
import { Root } from "./layouts/Root";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { PublicOnlyRoute } from "./features/auth/components/PublicOnlyRoute.tsx";

// features and pages
import { Tournament } from "./features/tournaments/Tournament";
import { Game } from "./pages/game/MultiplayerGamePage";
import { DesignSystem } from "./pages/design/DesignSystem";
import { Profile } from "./pages/profile/Profile";
import { Settings } from "./pages/settings/Settings";
import { BotGame } from "./pages/game/BotGamePage";
import { OAuthCallback } from "./pages/auth/OAuthCallback";
import { Register } from "./pages/auth/RegisterPage";
import { Login } from "./pages/auth/LoginPage";
import { Dashboard } from "./pages/dashboard/Dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      // public route
      { path: "design-system", Component: DesignSystem },

      // protected routes
      {
        Component: ProtectedRoute,
        children: [
          { index: true, Component: Dashboard },
          { path: "tournament", Component: Tournament },
          { path: "profile", Component: Profile },
          { path: "settings", Component: Settings },
        ],
      },
    ],
  },

  // protected full-screen routes
  {
    Component: ProtectedRoute,
    children: [{ path: "/game", Component: Game }],
  },

  // Redirects to "/" if already logged in
  {
    Component: PublicOnlyRoute,
    children: [
      { path: "/register", Component: Register },
      { path: "/login", Component: Login },
    ],
  },

  // public - user can play test game agains bot
  { path: "/auth/github/callback", Component: OAuthCallback },
  { path: "/bot", Component: BotGame },
]);
