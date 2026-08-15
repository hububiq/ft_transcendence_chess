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
  friendsRevision: number;
  activeGameRevision: number;
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

  // Keep chat messages and presence as separate pieces of client state
  const [messages, setMessages] = useState<
    ChatMessageServerEvent[]
  >([]);
  const [onlineUsers, setOnlineUsers] = useState<
    ChatAuthor[]
  >([]);
  const [friendsRevision, setFriendsRevision] =
    useState(0);
  const [activeGameRevision, setActiveGameRevision] =
    useState(0);
  const [connectionState, setConnectionState] =
    useState<ChatConnectionState>("disconnected");
  const [authenticatedUser, setAuthenticatedUser] =
    useState<ChatAuthor | null>(null);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  // Refs keep connection lifecycle data without triggering React renders
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isAuthenticatedRef = useRef(false);
  const isIntentionalCloseRef = useRef(false);
  const authFailureRef = useRef<ChatErrorCode | null>(null);
  const authRefreshAttemptedRef = useRef(false);
  const hasAuthenticatedConnectionRef = useRef(false);

  // Resolve the WebSocket URL once and expose configuration errors to the UI
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
    // No authenticated application user means no chat connection
    if (!userId) {
      setMessages([]);
      setOnlineUsers([]);
      setFriendsRevision(0);
      setActiveGameRevision(0);
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

    // Prevent old async callbacks from modifying state after cleanup
    let isDisposed = false;

    // Start every authenticated user session with fresh local chat state
    setMessages([]);
    setOnlineUsers([]);
    authRefreshAttemptedRef.current = false;
    hasAuthenticatedConnectionRef.current = false;

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
      // Never reconnect after logout or intentional component cleanup
      if (
        isDisposed ||
        isIntentionalCloseRef.current
      ) {
        return;
      }

      clearReconnectTimer();
      setConnectionState("reconnecting");

      // Increase reconnect delay gradually and cap it at the final configured value
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

        // Update the shared auth state before opening a new WebSocket
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
      // Ignore delayed reconnect callbacks after intentional cleanup
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

      // Reset per-connection authentication state before opening a new socket
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

      // Keep a reference to the socket that currently owns event callbacks
      socketRef.current = socket;

      socket.onopen = () => {
        // Ignore stale sockets created by an older connection attempt
        if (
          isDisposed ||
          socketRef.current !== socket
        ) {
          socket.close();
          return;
        }

        setConnectionState("authenticating");

        // Authentication is always the first event sent after opening the socket
        const event: AuthenticateClientEvent = {
          type: "authenticate",
          access_token: accessToken,
        };

        socket.send(JSON.stringify(event));
      };

      socket.onmessage = (messageEvent) => {
        // Ignore messages from sockets that are no longer the active connection
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

        // Validate every server payload before using it in React state
        const event = parseChatServerEvent(decodedPayload);

        if (!event) {
          setErrorMessage(
            "The chat server returned an unsupported event",
          );
          return;
        }

        if (event.type === "authenticated") {
          // Reject a socket if backend authentication resolves to another user
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

          // Mark the socket ready only after backend authentication succeeds
          isAuthenticatedRef.current = true;
          reconnectAttemptRef.current = 0;
          authRefreshAttemptedRef.current = false;
          setAuthenticatedUser(event.user);
          setConnectionState("connected");
          setErrorMessage(null);

          // Revalidate active game state after every successful application WebSocket connection
          setActiveGameRevision(
            (currentRevision) =>
              currentRevision + 1,
          );

          if (hasAuthenticatedConnectionRef.current) {
            // Refresh friendship data after recovering a lost WebSocket connection
            setFriendsRevision(
              (currentRevision) =>
                currentRevision + 1,
            );
          } else {
            hasAuthenticatedConnectionRef.current = true;
          }

          return;
        }

        if (event.type === "chat_message") {
          setMessages((currentMessages) => {
            // Ignore duplicate messages that may arrive during connection recovery
            const alreadyExists = currentMessages.some(
              (message) =>
                message.message_id === event.message_id,
            );

            if (alreadyExists) {
              return currentMessages;
            }

            // Keep only a bounded number of messages in browser memory
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

        if (event.type === "friends_changed") {
          // Trigger friendship refresh without storing friendship data in the chat hook
          setFriendsRevision(
            (currentRevision) =>
              currentRevision + 1,
          );
          return;
        }

        if (event.type === "active_game_changed") {
          // Trigger active game refresh without storing game data in the chat hook
          setActiveGameRevision(
            (currentRevision) =>
              currentRevision + 1,
          );
          return;
        }

        // Remember auth-related errors because they control close and reconnect behavior
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
        // Ignore close callbacks from sockets that have already been replaced
        if (socketRef.current !== socket) {
          return;
        }

        socketRef.current = null;
        isAuthenticatedRef.current = false;
        setAuthenticatedUser(null);

        // Do not keep stale presence while the socket is disconnected
        setOnlineUsers([]);

        // Intentional cleanup must never start the reconnect loop
        if (
          isDisposed ||
          isIntentionalCloseRef.current
        ) {
          setConnectionState("disconnected");
          return;
        }

        const authFailure = authFailureRef.current;

        // Try the existing HTTP refresh flow once before reconnecting after auth failure
        if (
          (authFailure === "AUTH_EXPIRED" ||
            authFailure === "AUTH_INVALID") &&
          !authRefreshAttemptedRef.current
        ) {
          authRefreshAttemptedRef.current = true;
          void refreshAccessTokenAndReconnect(connect);
          return;
        }

        // Other authentication failures require explicit user action
        if (authFailure !== null) {
          setConnectionState("error");
          return;
        }

        // Unexpected connection loss uses the reconnect backoff
        scheduleReconnect(connect);
      };
    };

    // Start one connection lifecycle for the current authenticated user
    isIntentionalCloseRef.current = false;
    reconnectAttemptRef.current = 0;
    connect();

    return () => {
      // Stop timers and callbacks before closing the current socket
      isDisposed = true;
      isIntentionalCloseRef.current = true;
      isAuthenticatedRef.current = false;
      clearReconnectTimer();

      const socket = socketRef.current;
      socketRef.current = null;

      if (socket) {
        // Detach handlers so cleanup cannot trigger another reconnect attempt
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
      // Normalize user input before applying the client-side validation rules
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

      // Sending is allowed only through an open and authenticated socket
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

      // The client sends only text while author and metadata are assigned by the backend
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
    friendsRevision,
    connectionState,
    activeGameRevision,
    authenticatedUser,
    errorMessage,
    sendMessage,
    clearError,
  };
}