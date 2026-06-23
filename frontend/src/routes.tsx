import { createBrowserRouter } from "react-router";
import { Root } from "./app/components/layout/Root";
import { Dashboard } from "./app/pages/Dashboard";
import { Auth } from "./app/pages/Auth";
import { Tournament } from "./app/pages/Tournament";
import { Game } from "./app/pages/Game";
import { DesignSystem } from "./app/pages/DesignSystem";
import { Profile } from "./app/pages/Profile";
import { Settings } from "./app/pages/Settings";
import { BotGame } from "./app/pages/BotGame";

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
  { path: "/auth", Component: Auth },
  { path: "/game", Component: Game },
  { path: "/bot", Component: BotGame },
]);
