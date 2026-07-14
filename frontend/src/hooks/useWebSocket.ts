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

  useEffect(() => {
    if (!enabled) return;

    const socket = new WebSocket(url);
    wsRef.current = socket;

    socket.onopen = () => console.log("Connected to Chess Backend!");

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
