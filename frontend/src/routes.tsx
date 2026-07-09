import { createBrowserRouter } from "react-router";
import { Root } from "./layouts/Root";
import { Dashboard } from "./pages/dashboard/Dashboard";
// import { Auth } from "./pages/auth/Auth";
import { Tournament } from "./features/tournaments/Tournament";
import { Game } from "./pages/game/MultiplayerGamePage";
import { DesignSystem } from "./pages/design/DesignSystem";
import { Profile } from "./pages/profile/Profile";
import { Settings } from "./pages/settings/Settings";
import { BotGame } from "./pages/game/BotGamePage";
import { OAuthCallback } from "./pages/auth/OAuthCallback";
import Register from "./pages/auth/RegisterPage";
import Login from "./pages/auth/LoginPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: "tournament", Component: Tournament },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
      { path: "design-system", Component: DesignSystem },
    ],
  },
  { path: "/auth/github/callback", Component: OAuthCallback },
  { path: "/register", Component: Register },
  { path: "/login", Component: Login },
  { path: "/game", Component: Game },
  { path: "/bot", Component: BotGame },
]);
