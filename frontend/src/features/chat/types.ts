export const CHAT_MESSAGE_MAX_LENGTH = 500;
export const CHAT_ERROR_MESSAGE_MAX_LENGTH = 200;
export const MAX_VISIBLE_CHAT_MESSAGES = 200;

// Represent the full lifecycle of the global chat WebSocket connection
export type ChatConnectionState =
  | "disconnected"
  | "connecting"
  | "authenticating"
  | "connected"
  | "reconnecting"
  | "error";

// Public user identity shared by chat messages and presence updates
export interface ChatAuthor {
  id: number;
  username: string;
}

// Authentication must be the first event sent by the client
export interface AuthenticateClientEvent {
  type: "authenticate";
  access_token: string;
}

// The client sends only message text and never controls the author
export interface SendMessageClientEvent {
  type: "chat_message";
  text: string;
}

// Events that are allowed to travel from the client to the backend
export type ChatClientEvent =
  | AuthenticateClientEvent
  | SendMessageClientEvent;

// Confirms that the backend verified the current WebSocket user
export interface AuthenticatedServerEvent {
  type: "authenticated";
  user: ChatAuthor;
}

// Chat messages received from the backend contain server-controlled metadata
export interface ChatMessageServerEvent {
  type: "chat_message";
  message_id: string;
  author: ChatAuthor;
  text: string;
  sent_at: string;
}

// Presence is a complete snapshot of currently connected authenticated users
export interface PresenceServerEvent {
  type: "presence";
  users: ChatAuthor[];
}

// Notify the client that its friendship data must be refreshed
export interface FriendsChangedServerEvent {
  type: "friends_changed";
}

// Notify the client that its active game data must be refreshed
export interface ActiveGameChangedServerEvent {
  type: "active_game_changed";
}

// Reconnect status always uses backend-controlled game and user identifiers
export interface GameReconnectPendingServerEvent {
  type: "game_reconnect_pending";
  game_id: number;
  disconnected_user_id: number;
  reconnect_deadline: string;
}

export interface GameReconnectedServerEvent {
  type: "game_reconnected";
  game_id: number;
  reconnected_user_id: number;
}

export interface GameReconnectResultServerEvent {
  type: "game_reconnect_result";
  game_id: number;
  winner_id: number;
  loser_id: number;
  reason: "disconnect_timeout";
}

export type GameReconnectServerEvent =
  | GameReconnectPendingServerEvent
  | GameReconnectedServerEvent
  | GameReconnectResultServerEvent;

// Public error codes shared between the backend protocol and frontend UI
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

// Every validated event that the backend may send to the frontend
export type ChatServerEvent =
  | AuthenticatedServerEvent
  | ChatMessageServerEvent
  | PresenceServerEvent
  | FriendsChangedServerEvent
  | ActiveGameChangedServerEvent
  | GameReconnectServerEvent
  | ErrorServerEvent;

// Return a predictable result to the UI without throwing for expected send failures
export type SendChatMessageResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
    };