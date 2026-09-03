import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  AlertCircle,
  LoaderCircle,
  Send,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import clsx from "clsx";

import { useGlobalChat } from "../context/GlobalChatProvider";
import {
  CHAT_MESSAGE_MAX_LENGTH,
  type ChatConnectionState,
} from "../types";


interface ConnectionPresentation {
  label: string;
  className: string;
  icon: "online" | "loading" | "offline";
}


// Format message timestamps as hours and minutes
const MESSAGE_TIME_FORMATTER = new Intl.DateTimeFormat(
  undefined,
  {
    hour: "2-digit",
    minute: "2-digit",
  },
);


// Convert the connection state into text and styling for the UI
function getConnectionPresentation(
  state: ChatConnectionState,
): ConnectionPresentation {
  switch (state) {
    case "connected":
      return {
        label: "Connected",
        className: "text-green-500",
        icon: "online",
      };

    case "connecting":
      return {
        label: "Connecting...",
        className: "text-amber-500",
        icon: "loading",
      };

    case "authenticating":
      return {
        label: "Authenticating...",
        className: "text-amber-500",
        icon: "loading",
      };

    case "reconnecting":
      return {
        label: "Reconnecting...",
        className: "text-amber-500",
        icon: "loading",
      };

    case "error":
      return {
        label: "Connection error",
        className: "text-red-500",
        icon: "offline",
      };

    case "disconnected":
      return {
        label: "Disconnected",
        className: "text-neutral-600",
        icon: "offline",
      };
  }
}


// Convert the server timestamp into a short readable time
function formatMessageTime(timestamp: string): string {
  return MESSAGE_TIME_FORMATTER.format(
    new Date(timestamp),
  );
}


export function GlobalChatPanel() {
  // Keep the current message input inside the chat panel
  const [inputValue, setInputValue] = useState("");

  // Mark the bottom of the message list for automatic scrolling
  const bottomMarkerRef = useRef<HTMLDivElement | null>(
    null,
  );

  // Use the WebSocket hook as the source of chat data and actions
  const {
    messages,
    connectionState,
    authenticatedUser,
    errorMessage,
    sendMessage,
    clearError,
  } = useGlobalChat();

  // Prepare the connection status shown above the messages
  const connection = getConnectionPresentation(
    connectionState,
  );

  // Allow sending only after WebSocket authentication succeeds
  const canSend = connectionState === "connected";

  // Use trimmed text to decide whether the send button should be active
  const trimmedInput = inputValue.trim();

  useEffect(() => {
    // Scroll to the newest message whenever the message list changes
    bottomMarkerRef.current?.scrollIntoView({
      block: "nearest",
    });
  }, [messages]);

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    // Keep form submission inside the chat without reloading the page
    event.preventDefault();

    const result = sendMessage(inputValue);

    // Clear the input only when the message was sent successfully
    if (result.ok) {
      setInputValue("");
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Show the current WebSocket connection state */}
      <div className="px-4 py-2 border-b border-neutral-900 flex items-center justify-between text-[11px]">
        <div
          className={clsx(
            "flex items-center gap-1.5 font-medium",
            connection.className,
          )}
        >
          {connection.icon === "online" && (
            <Wifi className="w-3 h-3" />
          )}

          {connection.icon === "loading" && (
            <LoaderCircle className="w-3 h-3 animate-spin" />
          )}

          {connection.icon === "offline" && (
            <WifiOff className="w-3 h-3" />
          )}

          <span>{connection.label}</span>
        </div>

        {/* Show which authenticated user owns this chat connection */}
        {authenticatedUser && (
          <span className="text-neutral-600 truncate max-w-28">
            as {authenticatedUser.username}
          </span>
        )}
      </div>

      {/* Display messages received from the global chat WebSocket */}
      <div
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          // Show a simple message when the chat is still empty
          <p className="text-xs text-neutral-600 text-center py-6">
            {canSend
              ? "No messages yet. Start the conversation."
              : "Messages will appear after the chat connects."}
          </p>
        ) : (
          messages.map((message) => {
            if (
              message.type === "chat_user_joined" ||
              message.type === "chat_user_left"
            ) {
              const didJoin =
                message.type === "chat_user_joined";

              return (
                <p
                  key={message.event_id}
                  className={clsx(
                    "text-right text-[10px] italic break-words",
                    didJoin
                      ? "text-emerald-300/50"
                      : "text-rose-300/45"
                  )}
                >
                  {message.user.username}{" "}
                  {didJoin
                    ? "joined the chat"
                    : "left the chat"}
                </p>
              );
            }

            // Use a different label and style for the current user's messages
            const isOwnMessage =
              message.author.id === authenticatedUser?.id;

            return (
              <div
                key={message.message_id}
                className="text-sm leading-5"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={clsx(
                      "font-medium truncate",
                      isOwnMessage
                        ? "text-blue-400"
                        : "text-purple-400",
                    )}
                  >
                    {isOwnMessage
                      ? "You"
                      : message.author.username}
                  </span>

                  <time
                    dateTime={message.sent_at}
                    className="text-[10px] text-neutral-700 shrink-0"
                  >
                    {formatMessageTime(message.sent_at)}
                  </time>
                </div>

                {/* Render the message as a React text node and never as HTML */}
                <p className="text-neutral-400 break-words whitespace-pre-wrap">
                  {message.text}
                </p>
              </div>
            );
          })
        )}

        {/* Keep a marker at the end for automatic scrolling */}
        <div ref={bottomMarkerRef} />
      </div>

      {/* Show safe chat errors returned by the hook or backend */}
      {errorMessage && (
        <div className="mx-3 mb-2 px-2 py-1.5 rounded border border-red-900/60 bg-red-950/30 flex items-start gap-2 text-xs text-red-300">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />

          <span className="flex-1">{errorMessage}</span>

          {/* Let the user dismiss the current chat error */}
          <button
            type="button"
            onClick={clearError}
            aria-label="Dismiss chat error"
            className="text-red-500 hover:text-red-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Send new messages through the connected WebSocket */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-neutral-900 bg-[#050505]"
      >
        <div className="flex gap-2">
          {/* Keep the input controlled and within the frontend length limit */}
          <input
            type="text"
            value={inputValue}
            onChange={(event) =>
              setInputValue(event.target.value)
            }
            maxLength={CHAT_MESSAGE_MAX_LENGTH}
            disabled={!canSend}
            placeholder={
              canSend
                ? "Type a message..."
                : connection.label
            }
            aria-label="Global chat message"
            className="flex-1 min-w-0 bg-neutral-900/50 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          />

          {/* Disable sending until the chat is connected and the text is not empty */}
          <button
            type="submit"
            disabled={!canSend || trimmedInput.length === 0}
            aria-label="Send global chat message"
            className="p-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Show how much of the message length limit is currently used */}
        <div className="mt-1 text-right text-[10px] text-neutral-700">
          {inputValue.length}/{CHAT_MESSAGE_MAX_LENGTH}
        </div>
      </form>
    </div>
  );
}