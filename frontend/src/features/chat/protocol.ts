import {
  CHAT_ERROR_MESSAGE_MAX_LENGTH,
  CHAT_MESSAGE_MAX_LENGTH,
  type ChatAuthor,
  type ChatErrorCode,
  type ChatServerEvent,
} from "./types";


const CHAT_ERROR_CODES: ReadonlySet<ChatErrorCode> = new Set([
  "AUTH_REQUIRED",
  "AUTH_INVALID",
  "AUTH_EXPIRED",
  "INVALID_JSON",
  "INVALID_EVENT",
  "EMPTY_MESSAGE",
  "MESSAGE_TOO_LONG",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
]);


function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  // Reject null values arrays and primitive values before reading object fields
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


function parseAuthor(
  value: unknown,
): ChatAuthor | null {
  if (!isRecord(value)) {
    return null;
  }

  // Accept only positive integer user identifiers
  if (
    typeof value.id !== "number" ||
    !Number.isInteger(value.id) ||
    value.id <= 0
  ) {
    return null;
  }

  // Validate the public username before exposing it to the UI
  if (
    typeof value.username !== "string" ||
    value.username.trim().length === 0 ||
    value.username.length > 150
  ) {
    return null;
  }

  return {
    id: value.id,
    username: value.username,
  };
}


function isValidTimestamp(
  value: unknown,
): value is string {
  // Accept only strings that can be parsed as a valid timestamp
  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  );
}


export function parseChatServerEvent(
  value: unknown,
): ChatServerEvent | null {
  // Treat all WebSocket input as untrusted until its shape is validated
  if (
    !isRecord(value) ||
    typeof value.type !== "string"
  ) {
    return null;
  }

  if (value.type === "authenticated") {
    const user = parseAuthor(value.user);

    return user
      ? {
          type: "authenticated",
          user,
        }
      : null;
  }

  if (value.type === "chat_message") {
    const author = parseAuthor(value.author);

    // Validate every field before adding the message to frontend state
    if (
      !author ||
      typeof value.message_id !== "string" ||
      value.message_id.length === 0 ||
      typeof value.text !== "string" ||
      value.text.length === 0 ||
      value.text.length > CHAT_MESSAGE_MAX_LENGTH ||
      !isValidTimestamp(value.sent_at)
    ) {
      return null;
    }

    return {
      type: "chat_message",
      message_id: value.message_id,
      author,
      text: value.text,
      sent_at: value.sent_at,
    };
  }

  if (value.type === "presence") {
    if (!Array.isArray(value.users)) {
      return null;
    }

    const users: ChatAuthor[] = [];

    // Validate every user received in the presence snapshot
    for (const item of value.users) {
      const user = parseAuthor(item);

      // Reject the entire snapshot if one user entry is malformed
      if (!user) {
        return null;
      }

      users.push(user);
    }

    return {
      type: "presence",
      users,
    };
  }

  if (value.type === "error") {
    // Accept only documented error codes and bounded public messages
    if (
      typeof value.code !== "string" ||
      !CHAT_ERROR_CODES.has(
        value.code as ChatErrorCode,
      ) ||
      typeof value.message !== "string" ||
      value.message.length === 0 ||
      value.message.length > CHAT_ERROR_MESSAGE_MAX_LENGTH
    ) {
      return null;
    }

    return {
      type: "error",
      code: value.code as ChatErrorCode,
      message: value.message,
    };
  }

  // Ignore unknown server event types instead of trusting unexpected payloads
  return null;
}