import { createBrowserRouter } from "react-router";
import { Root } from "./layouts/Root";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { PublicOnlyRoute } from "./features/auth/components/PublicOnlyRoute.tsx";

// features and pages
import { Tournament } from "./pages/tournaments/Tournament.tsx";
import { Game } from "./pages/game/MultiplayerGamePage";
import { DesignSystem } from "./pages/design/DesignSystem";
import { Profile } from "./pages/profile/Profile";
import { Statistics } from "./pages/statistics/Statistics";
import { Leaderboard } from "./pages/leaderboard/Leaderboard";
import { BotGame } from "./pages/game/BotGamePage";
import { OAuthCallback } from "./pages/auth/OAuthCallback";
import { Register } from "./pages/auth/RegisterPage";
import { Login } from "./pages/auth/LoginPage";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { TermsPage } from "./pages/terms_privacy/TermsPage.tsx";
import { PrivacyPage } from "./pages/terms_privacy/PrivacyPage.tsx";

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
          { path: "statistics", Component: Statistics },
          { path: "leaderboard", Component: Leaderboard },
        ],
      },
    ],
  },

  // protected full-screen routes
  {
    Component: ProtectedRoute,
    children: [{ path: "/game/:gameId", Component: Game }],
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
  // static legal pages
  { path: "/terms", Component: TermsPage },
  { path: "/privacy", Component: PrivacyPage },
]);
