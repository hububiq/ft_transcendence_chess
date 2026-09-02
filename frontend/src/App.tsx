import { RouterProvider } from "react-router";
import { router } from "./routes.tsx";
import { GlobalChatProvider } from "./features/chat/context/GlobalChatProvider";
import { GameReconnectBanner } from "./features/gameplay/components/GameReconnectBanner";

export default function App() {
  return (
    // Keep the shared WebSocket active across route changes
    <GlobalChatProvider>
      <RouterProvider router={router} />
      <GameReconnectBanner />
    </GlobalChatProvider>
  );
}