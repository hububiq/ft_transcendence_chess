import { RouterProvider } from "react-router";
import { router } from "./routes.tsx";
import { GlobalChatProvider } from "./features/chat/context/GlobalChatProvider";

export default function App() {
  return (
    // Keep the shared WebSocket active across route changes
    <GlobalChatProvider>
      <RouterProvider router={router} />
    </GlobalChatProvider>
  );
}