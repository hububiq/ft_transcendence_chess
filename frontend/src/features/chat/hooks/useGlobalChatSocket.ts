import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { fetchCurrentUser } from "../../auth/api/authService";
import { useAuth } from "../../auth/context/AuthProvider";
import { getGlobalChatWebSocketUrl } from "../config";
import { parseChatServerEvent } from "../protocol";
import {
  CHAT_MESSAGE_MAX_LENGTH,
  MAX_VISIBLE_CHAT_MESSAGES,
  type AuthenticateClientEvent,
  type ChatAuthor,
  type ChatConnectionState,
  type ChatErrorCode,
  type ChatMessageServerEvent,
  type SendChatMessageResult,
  type SendMessageClientEvent,
} from "../types";


const RECONNECT_DELAYS_MS = [
  1_000,
  2_000,
  4_000,
  8_000,
  10_000,
] as const;


interface UseGlobalChatSocketResult {
  messages: ChatMessageServerEvent[];
  onlineUsers: ChatAuthor[];
  connectionState: ChatConnectionState;
  authenticatedUser: ChatAuthor | null;
  errorMessage: string | null;
  sendMessage: (
    text: string,
  ) => SendChatMessageResult;
  clearError: () => void;
}


export function useGlobalChatSocket(): UseGlobalChatSocketResult {
  const { user, setUser } = useAuth();
  const userId = user?.id ?? null;

  const [messages, setMessages] = useState<
    ChatMessageServerEvent[]
  >([]);
  const [onlineUsers, setOnlineUsers] = useState<
    ChatAuthor[]
  >([]);
  const [connectionState, setConnectionState] =
    useState<ChatConnectionState>("disconnected");
  const [authenticatedUser, setAuthenticatedUser] =
    useState<ChatAuthor | null>(null);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isAuthenticatedRef = useRef(false);
  const isIntentionalCloseRef = useRef(false);
  const authFailureRef = useRef<ChatErrorCode | null>(null);
  const authRefreshAttemptedRef = useRef(false);

  const socketUrlResult = useMemo(() => {
    try {
      return {
        url: getGlobalChatWebSocketUrl(),
        error: null,
      };
    } catch (error) {
      return {
        url: null,
        error:
          error instanceof Error
            ? error.message
            : "Global chat WebSocket URL is invalid",
      };
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setMessages([]);
      setOnlineUsers([]);
      setAuthenticatedUser(null);
      setConnectionState("disconnected");
      setErrorMessage(null);
      return;
    }

    if (!socketUrlResult.url) {
      setConnectionState("error");
      setErrorMessage(socketUrlResult.error);
      return;
    }

    const socketUrl = socketUrlResult.url;
    let isDisposed = false;

    setMessages([]);
    setOnlineUsers([]);
    authRefreshAttemptedRef.current = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleReconnect = (
      connect: () => void,
      delayOverride?: number,
    ) => {
      if (
        isDisposed ||
        isIntentionalCloseRef.current
      ) {
        return;
      }

      clearReconnectTimer();
      setConnectionState("reconnecting");

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
        // The existing Axios interceptor refreshes the access token after HTTP 401
        const response = await fetchCurrentUser();

        if (isDisposed) {
          return;
        }

        setUser(response.data);
        authFailureRef.current = null;
        reconnectAttemptRef.current = 0;
        scheduleReconnect(connect, 0);
      } catch {
        if (isDisposed) {
          return;
        }

        setConnectionState("error");
        setErrorMessage(
          "Authentication expired. Please log in again.",
        );
      }
    };

    const connect = () => {
      if (
        isDisposed ||
        isIntentionalCloseRef.current
      ) {
        return;
      }

      const accessToken = localStorage.getItem(
        "access_token",
      );

      if (!accessToken) {
        setConnectionState("error");
        setErrorMessage("Authentication token is missing");
        return;
      }

      clearReconnectTimer();
      authFailureRef.current = null;
      isAuthenticatedRef.current = false;
      setAuthenticatedUser(null);
      setConnectionState(
        reconnectAttemptRef.current === 0
          ? "connecting"
          : "reconnecting",
      );

      let socket: WebSocket;

      try {
        socket = new WebSocket(socketUrl);
      } catch {
        setConnectionState("error");
        setErrorMessage(
          "Global chat connection could not be opened",
        );
        return;
      }

      socketRef.current = socket;

      socket.onopen = () => {
        if (
          isDisposed ||
          socketRef.current !== socket
        ) {
          socket.close();
          return;
        }

        setConnectionState("authenticating");

        const event: AuthenticateClientEvent = {
          type: "authenticate",
          access_token: accessToken,
        };

        socket.send(JSON.stringify(event));
      };

      socket.onmessage = (messageEvent) => {
        if (
          isDisposed ||
          socketRef.current !== socket
        ) {
          return;
        }

        let decodedPayload: unknown;

        try {
          decodedPayload = JSON.parse(
            String(messageEvent.data),
          );
        } catch {
          setErrorMessage(
            "The chat server returned invalid JSON",
          );
          return;
        }

        const event = parseChatServerEvent(decodedPayload);

        if (!event) {
          setErrorMessage(
            "The chat server returned an unsupported event",
          );
          return;
        }

        if (event.type === "authenticated") {
          if (event.user.id !== userId) {
            authFailureRef.current = "AUTH_INVALID";
            authRefreshAttemptedRef.current = true;
            setConnectionState("error");
            setErrorMessage(
              "Chat authentication returned a different user",
            );
            socket.close(1008, "User identity mismatch");
            return;
          }

          isAuthenticatedRef.current = true;
          reconnectAttemptRef.current = 0;
          authRefreshAttemptedRef.current = false;
          setAuthenticatedUser(event.user);
          setConnectionState("connected");
          setErrorMessage(null);
          return;
        }

        if (event.type === "chat_message") {
          setMessages((currentMessages) => {
            const alreadyExists = currentMessages.some(
              (message) =>
                message.message_id === event.message_id,
            );

            if (alreadyExists) {
              return currentMessages;
            }

            return [
              ...currentMessages,
              event,
            ].slice(-MAX_VISIBLE_CHAT_MESSAGES);
          });
          return;
        }

        if (event.type === "presence") {
          // Replace the previous presence snapshot with the newest server state
          setOnlineUsers(event.users);
          return;
        }

        authFailureRef.current = event.code.startsWith(
          "AUTH_",
        )
          ? event.code
          : null;
        setErrorMessage(event.message);
      };

      socket.onerror = () => {
        // The close event owns reconnect and visible connection state
      };

      socket.onclose = () => {
        if (socketRef.current !== socket) {
          return;
        }

        socketRef.current = null;
        isAuthenticatedRef.current = false;
        setAuthenticatedUser(null);
        // Do not keep stale presence while the socket is disconnected
        setOnlineUsers([]);

        if (
          isDisposed ||
          isIntentionalCloseRef.current
        ) {
          setConnectionState("disconnected");
          return;
        }

        const authFailure = authFailureRef.current;

        if (
          (authFailure === "AUTH_EXPIRED" ||
            authFailure === "AUTH_INVALID") &&
          !authRefreshAttemptedRef.current
        ) {
          authRefreshAttemptedRef.current = true;
          void refreshAccessTokenAndReconnect(connect);
          return;
        }

        if (authFailure !== null) {
          setConnectionState("error");
          return;
        }

        scheduleReconnect(connect);
      };
    };

    isIntentionalCloseRef.current = false;
    reconnectAttemptRef.current = 0;
    connect();

    return () => {
      isDisposed = true;
      isIntentionalCloseRef.current = true;
      isAuthenticatedRef.current = false;
      clearReconnectTimer();

      const socket = socketRef.current;
      socketRef.current = null;

      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close(
          1000,
          "Component unmounted or user logged out",
        );
      }
    };
  }, [
    setUser,
    socketUrlResult.error,
    socketUrlResult.url,
    userId,
  ]);

  const sendMessage = useCallback(
    (rawText: string): SendChatMessageResult => {
      const text = rawText.trim();

      if (!text) {
        const reason = "Message cannot be empty";
        setErrorMessage(reason);
        return {
          ok: false,
          reason,
        };
      }

      if (text.length > CHAT_MESSAGE_MAX_LENGTH) {
        const reason =
          `Message cannot exceed ` +
          `${CHAT_MESSAGE_MAX_LENGTH} characters`;

        setErrorMessage(reason);
        return {
          ok: false,
          reason,
        };
      }

      const socket = socketRef.current;

      if (
        !socket ||
        socket.readyState !== WebSocket.OPEN ||
        !isAuthenticatedRef.current
      ) {
        const reason = "Chat is not connected";
        setErrorMessage(reason);
        return {
          ok: false,
          reason,
        };
      }

      const event: SendMessageClientEvent = {
        type: "chat_message",
        text,
      };

      try {
        socket.send(JSON.stringify(event));
        setErrorMessage(null);
        return {
          ok: true,
        };
      } catch {
        const reason = "Message could not be sent";
        setErrorMessage(reason);
        return {
          ok: false,
          reason,
        };
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    messages,
    onlineUsers,
    connectionState,
    authenticatedUser,
    errorMessage,
    sendMessage,
    clearError,
  };
}