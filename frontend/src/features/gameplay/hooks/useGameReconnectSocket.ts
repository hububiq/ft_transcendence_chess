import { useEffect, useRef } from "react";

import { fetchCurrentUser } from "../../auth/api/authService";


const RECONNECT_DELAYS_MS = [
  1_000,
  2_000,
  4_000,
  8_000,
  10_000,
] as const;


interface UseGameReconnectSocketProps {
  url: string;
  enabled: boolean;
  onMessage: (data: any) => void;
}


export function useGameReconnectSocket({
  url,
  enabled,
  onMessage,
}: UseGameReconnectSocketProps) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const authRefreshAttemptedRef = useRef(false);

  const savedOnMessage = useRef(onMessage);

  useEffect(() => {
    savedOnMessage.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Prevent delayed reconnect attempts from surviving component cleanup
    let isDisposed = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const closeCurrentSocket = (reason: string) => {
      clearReconnectTimer();

      const socket = socketRef.current;
      socketRef.current = null;

      if (!socket) {
        return;
      }

      // Detach handlers before intentional closure so it cannot start reconnect
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      socket.close(
        1000,
        reason,
      );
    };

    const scheduleReconnect = (
      connect: () => void,
      delayOverride?: number,
    ) => {
      if (isDisposed) {
        return;
      }

      clearReconnectTimer();

      // Increase retry delay gradually while the backend reconnect grace is active
      const attempt = reconnectAttemptRef.current;
      const delay =
        delayOverride ??
        RECONNECT_DELAYS_MS[
          Math.min(
            attempt,
            RECONNECT_DELAYS_MS.length - 1,
          )
        ];

      reconnectAttemptRef.current += 1;

      reconnectTimerRef.current = window.setTimeout(
        connect,
        delay,
      );
    };

    const refreshAccessTokenAndReconnect = async (
      connect: () => void,
    ) => {
      try {
        // Reuse the existing Axios refresh flow before retrying an expired game session
        await fetchCurrentUser();

        if (isDisposed) {
          return;
        }

        reconnectAttemptRef.current = 0;
        scheduleReconnect(connect, 0);
      } catch {
        if (!isDisposed) {
          console.error(
            "Game WebSocket authentication could not be refreshed",
          );
        }
      }
    };

    const connect = () => {
      if (isDisposed) {
        return;
      }

      clearReconnectTimer();

      const accessToken = localStorage.getItem(
        "access_token",
      );

      if (!accessToken) {
        console.error(
          "Cannot authenticate game WebSocket without an access token",
        );
        return;
      }

      let socket: WebSocket;

      try {
        socket = new WebSocket(url);
      } catch (error) {
        console.error(
          "Failed to open game WebSocket:",
          error,
        );
        scheduleReconnect(connect);
        return;
      }

      // Keep only the newest socket as the active game connection
      socketRef.current = socket;

      socket.onopen = () => {
        // Ignore callbacks from a socket replaced by a newer reconnect attempt
        if (
          isDisposed ||
          socketRef.current !== socket
        ) {
          socket.close();
          return;
        }

        // Authenticate every replacement socket before sending game events
        socket.send(
          JSON.stringify({
            type: "authenticate",
            access_token: accessToken,
          }),
        );

        console.log("Connected to Chess Backend!");
      };

      socket.onmessage = (event) => {
        // Ignore messages from a socket replaced by a newer reconnect attempt
        if (
          isDisposed ||
          socketRef.current !== socket
        ) {
          return;
        }

        try {
          const data = JSON.parse(event.data);

          // Reset reconnect state only after the backend accepts the connection
          reconnectAttemptRef.current = 0;
          authRefreshAttemptedRef.current = false;

          console.log("Data: ", data);
          savedOnMessage.current(data);
        } catch (error) {
          console.error(
            "Failed to parse WebSocket message:",
            error,
          );
        }
      };

      socket.onerror = () => {
        // Let the close event schedule reconnect to avoid duplicate retry timers
      };

      socket.onclose = (event) => {
        // Ignore close callbacks from a socket replaced by a newer connection
        if (socketRef.current !== socket) {
          return;
        }

        socketRef.current = null;

        if (isDisposed) {
          return;
        }

        // Intentional normal closure must not start automatic reconnect
        if (event.code === 1000) {
          return;
        }

        if (event.code === 1008) {
          // Retry authentication once through the existing HTTP token refresh flow
          if (
            event.reason === "Authentication failed" &&
            !authRefreshAttemptedRef.current
          ) {
            authRefreshAttemptedRef.current = true;
            void refreshAccessTokenAndReconnect(connect);
          }

          return;
        }

        // Unexpected transport loss reconnects to the same game with backoff
        scheduleReconnect(connect);
      };
    };

    reconnectAttemptRef.current = 0;
    authRefreshAttemptedRef.current = false;

    // Start the first connection using the same lifecycle as later reconnects
    connect();

    const handlePageHide = () => {
      // Close the game socket before full-page navigation so reconnect grace can start promptly
      closeCurrentSocket(
        "Page hidden",
      );
    };

    window.addEventListener(
      "pagehide",
      handlePageHide,
    );

    return () => {
      // Stop all reconnect work before intentionally closing the current socket
      isDisposed = true;

      window.removeEventListener(
        "pagehide",
        handlePageHide,
      );

      closeCurrentSocket(
        "Component unmounted",
      );
    };
  }, [enabled, url]);

  const sendMessage = (payload: object) => {
    if (
      socketRef.current?.readyState ===
      WebSocket.OPEN
    ) {
      socketRef.current.send(
        JSON.stringify(payload),
      );
    } else {
      console.error(
        "WebSocket is not connected",
      );
    }
  };

  return {
    sendMessage,
  };
}