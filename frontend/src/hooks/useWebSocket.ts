import { useEffect, useRef } from "react";

interface UseWebSocketProps<TMessage> {
  url: string;
  enabled: boolean;
  onMessage: (data: TMessage) => void;
}

export function useWebSocket<TMessage>({
  url,
  enabled,
  onMessage,
}: UseWebSocketProps<TMessage>) {

  const wsRef = useRef<WebSocket | null>(null);

  const savedOnMessage = useRef(onMessage);

  useEffect(() => {
    savedOnMessage.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;

    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      console.error(
        "Cannot authenticate game WebSocket without an access token",
      );
      return;
    }

    const socket = new WebSocket(url);
    wsRef.current = socket;

    socket.onopen = () => {
      // Authenticate before sending any game events
      socket.send(
        JSON.stringify({
          type: "authenticate",
          access_token: accessToken,
        }),
      );
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TMessage;
        savedOnMessage.current(data);
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [url, enabled]);

  const sendMessage = (payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      console.error("WebSocket is not connected");
    }
  };

  return { sendMessage };
}
