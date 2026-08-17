import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";

export function useMatchmaking(
  userId?: number | null,
  eloRating: number = 1200,
) {
  const [isSearching, setIsSearching] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();

  const joinQueue = useCallback(() => {
    if (!userId) return;

    const ws = new WebSocket(
      `${import.meta.env.VITE_WS_BASE_URL}/ws/lobby/${userId}`,
    );
    wsRef.current = ws;

    ws.onopen = () => {
      setIsSearching(true);
      ws.send(
        JSON.stringify({
          type: "join_queue",
          elo_rating: eloRating,
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "info") {
          console.log("Matchmaking:", data.message);
        } else if (data.type === "match_start") {
          setIsSearching(false);
          ws.close();

          navigate(`/game/${data.game_id}`);
        }
      } catch (err) {
        console.error("Failed to parse lobby message", err);
      }
    };

    ws.onerror = () => setIsSearching(false);
    ws.onclose = () => setIsSearching(false);
  }, [userId, eloRating, navigate]);

  const cancelQueue = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "leave_lobby",
          }),
        );
      }
      wsRef.current.close();
    }
    console.log("Cancelled matchmaking search");
    setIsSearching(false);
  }, []);

  return { isSearching, joinQueue, cancelQueue };
}
