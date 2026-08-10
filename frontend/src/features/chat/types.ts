// Keep the frontend message limit consistent with the backend contract
export const CHAT_MESSAGE_MAX_LENGTH = 500;

// Limit the size of error messages accepted from the server
export const CHAT_ERROR_MESSAGE_MAX_LENGTH = 200;

// Keep only a limited number of messages in the current browser session
export const MAX_VISIBLE_CHAT_MESSAGES = 200;


// Describe every connection state that can be shown in the UI
export type ChatConnectionState =
  | "disconnected"
  | "connecting"
  | "authenticating"
  | "connected"
  | "reconnecting"
  | "error";


// Store only the public identity provided by the server
export interface ChatAuthor {
  id: number;
  username: string;
}


// Send the access token as the first event after opening the socket
export interface AuthenticateClientEvent {
  type: "authenticate";
  access_token: string;
}


// Send only message text without client-controlled author data
export interface SendMessageClientEvent {
  type: "chat_message";
  text: string;
}


// List every event that the browser is allowed to send
export type ChatClientEvent =
  | AuthenticateClientEvent
  | SendMessageClientEvent;


// Confirm that the server accepted the authenticated user
export interface AuthenticatedServerEvent {
  type: "authenticated";
  user: ChatAuthor;
}


// Describe a trusted chat message created by the server
export interface ChatMessageServerEvent {
  type: "chat_message";
  message_id: string;
  author: ChatAuthor;
  text: string;
  sent_at: string;
}


// List every safe chat error code returned by the backend
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


// Describe a safe error event returned by the server
export interface ErrorServerEvent {
  type: "error";
  code: ChatErrorCode;
  message: string;
}


// List every event that the frontend accepts from the server
export type ChatServerEvent =
  | AuthenticatedServerEvent
  | ChatMessageServerEvent
  | ErrorServerEvent;


// Give the UI a clear result after trying to send a message
export type SendChatMessageResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
    };