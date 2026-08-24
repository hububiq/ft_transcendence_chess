import { useEffect, useRef } from "react";

interface UseWebSocketProps {
  url: string;
  enabled: boolean;
  onMessage: (data: any) => void;
}

export function useWebSocket({ url, enabled, onMessage }: UseWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);

  const savedOnMessage = useRef(onMessage);

  useEffect(() => {
    savedOnMessage.current = onMessage;
  }, [onMessage]);

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

    console.log("Connected to Chess Backend!");
  };

  socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Data: ", data);
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
