export const CHAT_MESSAGE_MAX_LENGTH = 500;
export const CHAT_ERROR_MESSAGE_MAX_LENGTH = 200;
export const MAX_VISIBLE_CHAT_MESSAGES = 200;

export type ChatConnectionState =
  | "disconnected"
  | "connecting"
  | "authenticating"
  | "connected"
  | "reconnecting"
  | "error";

export interface ChatAuthor {
  id: number;
  username: string;
}

export interface AuthenticateClientEvent {
  type: "authenticate";
  access_token: string;
}

export interface SendMessageClientEvent {
  type: "chat_message";
  text: string;
}

export type ChatClientEvent =
  | AuthenticateClientEvent
  | SendMessageClientEvent;

export interface AuthenticatedServerEvent {
  type: "authenticated";
  user: ChatAuthor;
}

export interface ChatMessageServerEvent {
  type: "chat_message";
  message_id: string;
  author: ChatAuthor;
  text: string;
  sent_at: string;
}

export interface PresenceServerEvent {
  type: "presence";
  users: ChatAuthor[];
}

export type ChatErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_INVALID"
  | "AUTH_EXPIRED"
  | "INVALID_JSON"
  | "INVALID_EVENT"
  | "EMPTY_MESSAGE"
  | "MESSAGE_TOO_LONG"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface ErrorServerEvent {
  type: "error";
  code: ChatErrorCode;
  message: string;
}

export type ChatServerEvent =
  | AuthenticatedServerEvent
  | ChatMessageServerEvent
  | PresenceServerEvent
  | ErrorServerEvent;

export type SendChatMessageResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
    };