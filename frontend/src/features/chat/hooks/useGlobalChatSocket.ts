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


// Increase reconnect delays gradually instead of reconnecting in a tight loop
const RECONNECT_DELAYS_MS = [
  1_000,
  2_000,
  4_000,
  8_000,
  10_000,
] as const;


// Define the public API returned to components using this hook
interface UseGlobalChatSocketResult {
  messages: ChatMessageServerEvent[];
  connectionState: ChatConnectionState;
  authenticatedUser: ChatAuthor | null;
  errorMessage: string | null;
  sendMessage: (
    text: string,
  ) => SendChatMessageResult;
  clearError: () => void;
}


export function useGlobalChatSocket(): UseGlobalChatSocketResult {
  // Use the existing application authentication state
  const { user, setUser } = useAuth();
  const userId = user?.id ?? null;

  // Store values that should cause the UI to re-render
  const [messages, setMessages] = useState<
    ChatMessageServerEvent[]
  >([]);
  const [connectionState, setConnectionState] =
    useState<ChatConnectionState>("disconnected");
  const [authenticatedUser, setAuthenticatedUser] =
    useState<ChatAuthor | null>(null);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  // Keep socket lifecycle values between renders without causing re-renders
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isAuthenticatedRef = useRef(false);
  const isIntentionalCloseRef = useRef(false);
  const authFailureRef = useRef<ChatErrorCode | null>(null);
  const authRefreshAttemptedRef = useRef(false);

  // Resolve the WebSocket URL once and keep configuration errors safe
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
    // Do not keep a chat connection when no user is logged in
    if (!userId) {
      setMessages([]);
      setAuthenticatedUser(null);
      setConnectionState("disconnected");
      setErrorMessage(null);
      return;
    }

    // Stop before connecting when the WebSocket URL is invalid
    if (!socketUrlResult.url) {
      setConnectionState("error");
      setErrorMessage(socketUrlResult.error);
      return;
    }

    const socketUrl = socketUrlResult.url;

    // Prevent old async callbacks from acting after cleanup
    let isDisposed = false;

    // Start every authenticated user session with an empty message list
    setMessages([]);
    authRefreshAttemptedRef.current = false;

    const clearReconnectTimer = () => {
      // Remove any reconnect that is still waiting to run
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleReconnect = (
      connect: () => void,
      delayOverride?: number,
    ) => {
      // Never reconnect after logout, unmount, or another intentional close
      if (
        isDisposed ||
        isIntentionalCloseRef.current
      ) {
        return;
      }

      clearReconnectTimer();
      setConnectionState("reconnecting");

      const attempt = reconnectAttemptRef.current;

      // Increase the delay with each failed reconnect up to the maximum value
      const delay =
        delayOverride ??
        RECONNECT_DELAYS_MS[
          Math.min(
            attempt,
            RECONNECT_DELAYS_MS.length - 1,
          )
        ];

      reconnectAttemptRef.current += 1;

      // Schedule only one reconnect attempt at a time
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

        // Ignore the result if the hook was cleaned up while waiting
        if (isDisposed) {
          return;
        }

        // Keep the existing auth context synchronized after the refresh
        setUser(response.data);
        authFailureRef.current = null;
        reconnectAttemptRef.current = 0;

        // Retry immediately after a successful token refresh
        scheduleReconnect(connect, 0);
      } catch {
        if (isDisposed) {
          return;
        }

        // Stop reconnecting when authentication cannot be refreshed
        setConnectionState("error");
        setErrorMessage(
          "Authentication expired. Please log in again.",
        );
      }
    };

    const connect = () => {
      // Do not create a socket after this hook has been cleaned up
      if (
        isDisposed ||
        isIntentionalCloseRef.current
      ) {
        return;
      }

      // Read the current access token again for every connection attempt
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

      // Show whether this is the first connection or a reconnect attempt
      setConnectionState(
        reconnectAttemptRef.current === 0
          ? "connecting"
          : "reconnecting",
      );

      let socket: WebSocket;

      try {
        // Open a new browser WebSocket connection to the chat endpoint
        socket = new WebSocket(socketUrl);
      } catch {
        setConnectionState("error");
        setErrorMessage(
          "Global chat connection could not be opened",
        );
        return;
      }

      // Remember which socket is currently owned by this hook
      socketRef.current = socket;

      socket.onopen = () => {
        // Ignore an old socket that is no longer the active connection
        if (
          isDisposed ||
          socketRef.current !== socket
        ) {
          socket.close();
          return;
        }

        // Opening the socket is not enough to consider the chat authenticated
        setConnectionState("authenticating");

        // Authentication is always the first client event
        const event: AuthenticateClientEvent = {
          type: "authenticate",
          access_token: accessToken,
        };

        socket.send(JSON.stringify(event));
      };

      socket.onmessage = (messageEvent) => {
        // Ignore messages from sockets that are no longer active
        if (
          isDisposed ||
          socketRef.current !== socket
        ) {
          return;
        }

        let decodedPayload: unknown;

        try {
          // Decode incoming WebSocket data without trusting its structure
          decodedPayload = JSON.parse(
            String(messageEvent.data),
          );
        } catch {
          setErrorMessage(
            "The chat server returned invalid JSON",
          );
          return;
        }

        // Validate the decoded data against the frontend chat protocol
        const event = parseChatServerEvent(decodedPayload);

        if (!event) {
          setErrorMessage(
            "The chat server returned an unsupported event",
          );
          return;
        }

        if (event.type === "authenticated") {
          // Reject a server identity that does not match the logged in user
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

          // Mark the chat connected only after server authentication succeeds
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
            // Ignore a message that was already received before
            const alreadyExists = currentMessages.some(
              (message) =>
                message.message_id === event.message_id,
            );

            if (alreadyExists) {
              return currentMessages;
            }

            // Keep only the newest messages from the current browser session
            return [
              ...currentMessages,
              event,
            ].slice(-MAX_VISIBLE_CHAT_MESSAGES);
          });
          return;
        }

        // Remember authentication errors so close handling can react correctly
        authFailureRef.current = event.code.startsWith(
          "AUTH_",
        )
          ? event.code
          : null;

        // Show the safe error message returned by the backend
        setErrorMessage(event.message);
      };

      socket.onerror = () => {
        // The close event owns reconnect and visible connection state
      };

      socket.onclose = () => {
        // Ignore close events from sockets that have already been replaced
        if (socketRef.current !== socket) {
          return;
        }

        socketRef.current = null;
        isAuthenticatedRef.current = false;
        setAuthenticatedUser(null);

        // Do not reconnect after intentional cleanup
        if (
          isDisposed ||
          isIntentionalCloseRef.current
        ) {
          setConnectionState("disconnected");
          return;
        }

        const authFailure = authFailureRef.current;

        // Try the existing token refresh flow once after an auth failure
        if (
          (authFailure === "AUTH_EXPIRED" ||
            authFailure === "AUTH_INVALID") &&
          !authRefreshAttemptedRef.current
        ) {
          authRefreshAttemptedRef.current = true;
          void refreshAccessTokenAndReconnect(connect);
          return;
        }

        // Stop reconnecting when authentication failed and refresh did not recover it
        if (authFailure !== null) {
          setConnectionState("error");
          return;
        }

        // Reconnect with backoff after a normal unexpected connection loss
        scheduleReconnect(connect);
      };
    };

    // Start a fresh socket lifecycle for the current authenticated user
    isIntentionalCloseRef.current = false;
    reconnectAttemptRef.current = 0;
    connect();

    return () => {
      // Mark cleanup before closing anything to prevent reconnect races
      isDisposed = true;
      isIntentionalCloseRef.current = true;
      isAuthenticatedRef.current = false;

      // Cancel a reconnect that may still be waiting
      clearReconnectTimer();

      const socket = socketRef.current;
      socketRef.current = null;

      if (socket) {
        // Remove callbacks so an old socket cannot update React state
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        // Close cleanly on logout, user change, unmount, or StrictMode cleanup
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
      // Normalize user input before validating and sending it
      const text = rawText.trim();

      // Reject an empty message before it reaches the backend
      if (!text) {
        const reason = "Message cannot be empty";
        setErrorMessage(reason);
        return {
          ok: false,
          reason,
        };
      }

      // Apply the same message length limit on the frontend
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

      // Allow sending only through an open and authenticated socket
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

      // Send only the message text and never client-controlled author data
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
        // Keep the input usable when the browser fails to send the message
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
    // Allow the UI to dismiss the current chat error
    setErrorMessage(null);
  }, []);

  // Expose only the state and actions needed by the chat UI
  return {
    messages,
    connectionState,
    authenticatedUser,
    errorMessage,
    sendMessage,
    clearError,
  };
}