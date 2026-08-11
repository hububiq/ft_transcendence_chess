// Keep the chat endpoint path separate from the WebSocket host
const GLOBAL_CHAT_PATH = "/ws/chat";


function getDefaultWebSocketBaseUrl(): string {
  // Match the WebSocket protocol to the protocol used by the current page
  const protocol =
    window.location.protocol === "https:"
      ? "wss:"
      : "ws:";

  // Connect directly to FastAPI during local Vite development
  if (import.meta.env.DEV) {
    return `${protocol}//${window.location.hostname}:8001`;
  }

  // Use the current application host in the deployed environment
  return `${protocol}//${window.location.host}`;
}


export function getGlobalChatWebSocketUrl(): string {
  // Allow the default WebSocket address to be overridden by environment config
  const configuredBaseUrl =
    import.meta.env.VITE_WS_BASE_URL?.trim();

  let baseUrl = getDefaultWebSocketBaseUrl();

  // Ignore the placeholder from the example environment file
  if (
    configuredBaseUrl &&
    !configuredBaseUrl.includes("<") &&
    !configuredBaseUrl.includes(">")
  ) {
    // Remove trailing slashes before adding the chat path
    baseUrl = configuredBaseUrl.replace(/\/+$/, "");
  }

  // Reject configuration that is not a WebSocket URL
  if (
    !baseUrl.startsWith("ws://") &&
    !baseUrl.startsWith("wss://")
  ) {
    throw new Error(
      "VITE_WS_BASE_URL must start with ws:// or wss://",
    );
  }

  // Prevent an insecure WebSocket connection from an HTTPS page
  if (
    window.location.protocol === "https:" &&
    baseUrl.startsWith("ws://")
  ) {
    throw new Error(
      "HTTPS pages require a wss:// WebSocket URL",
    );
  }

  // Build the final URL used by the global chat client
  return `${baseUrl}${GLOBAL_CHAT_PATH}`;
}