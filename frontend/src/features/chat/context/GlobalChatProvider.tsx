import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";

import { useGlobalChatSocket } from "../hooks/useGlobalChatSocket";


type GlobalChatContextValue = ReturnType<
  typeof useGlobalChatSocket
>;


const GlobalChatContext =
  createContext<GlobalChatContextValue | null>(null);


export function GlobalChatProvider({
  children,
}: PropsWithChildren) {
  // Keep one shared WebSocket for chat and logged user presence
  const chat = useGlobalChatSocket();

  return (
    <GlobalChatContext.Provider value={chat}>
      {children}
    </GlobalChatContext.Provider>
  );
}


// eslint-disable-next-line react-refresh/only-export-components
export function useGlobalChat(): GlobalChatContextValue {
  const context = useContext(GlobalChatContext);

  if (!context) {
    throw new Error(
      "useGlobalChat must be used within GlobalChatProvider",
    );
  }

  return context;
}