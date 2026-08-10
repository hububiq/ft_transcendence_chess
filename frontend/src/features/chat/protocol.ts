import {
  CHAT_ERROR_MESSAGE_MAX_LENGTH,
  CHAT_MESSAGE_MAX_LENGTH,
  type ChatAuthor,
  type ChatErrorCode,
  type ChatServerEvent,
} from "./types";


// Keep the accepted server error codes in one runtime-safe collection
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
  // Accept only regular JSON objects
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


function parseAuthor(
  value: unknown,
): ChatAuthor | null {
  // Reject author data that is not an object
  if (!isRecord(value)) {
    return null;
  }

  // Require a positive integer user id
  if (
    typeof value.id !== "number" ||
    !Number.isInteger(value.id) ||
    value.id <= 0
  ) {
    return null;
  }

  // Require a non-empty username within the expected limit
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
  // Accept only strings that JavaScript can parse as a date
  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  );
}


export function parseChatServerEvent(
  value: unknown,
): ChatServerEvent | null {
  // Runtime validation is required because network data cannot be trusted
  if (
    !isRecord(value) ||
    typeof value.type !== "string"
  ) {
    return null;
  }

  if (value.type === "authenticated") {
    // Validate the trusted user returned after authentication
    const user = parseAuthor(value.user);

    return user
      ? {
          type: "authenticated",
          user,
        }
      : null;
  }

  if (value.type === "chat_message") {
    // Validate the author separately before accepting the message
    const author = parseAuthor(value.author);

    // Reject incomplete or malformed chat messages
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

  if (value.type === "error") {
    // Accept only known error codes and bounded error messages
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

  // Ignore server events that are not part of the chat protocol
  return null;
}