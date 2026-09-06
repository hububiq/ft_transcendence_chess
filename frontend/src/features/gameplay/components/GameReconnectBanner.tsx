import {
  useEffect,
  useState,
} from "react";

import { useGlobalChat } from "../../chat/context/GlobalChatProvider";


const RECONNECTED_MESSAGE_DURATION_MS = 3_000;
const RESULT_MESSAGE_DURATION_MS = 6_000;


function formatRemainingTime(
  seconds: number,
): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    `${minutes}:` +
    remainingSeconds.toString().padStart(2, "0")
  );
}


export function GameReconnectBanner() {
  const {
    authenticatedUser,
    gameReconnectEvent,
  } = useGlobalChat();

  const [dismissedEvent, setDismissedEvent] =
    useState<typeof gameReconnectEvent>(null);

  const isVisible =
    gameReconnectEvent !== null &&
    dismissedEvent !== gameReconnectEvent;
  const [
    remainingSeconds,
    setRemainingSeconds,
  ] = useState(0);

  useEffect(() => {
    if (
      !gameReconnectEvent ||
      gameReconnectEvent.type === "game_reconnect_pending"
    ) {
      return;
    }

    const eventToDismiss = gameReconnectEvent;

    const duration =
      gameReconnectEvent.type === "game_reconnected"
        ? RECONNECTED_MESSAGE_DURATION_MS
        : RESULT_MESSAGE_DURATION_MS;

    const timer = window.setTimeout(
      () => {
        setDismissedEvent(eventToDismiss);
      },
      duration,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [gameReconnectEvent]);

  useEffect(() => {
    if (
      gameReconnectEvent?.type !==
      "game_reconnect_pending"
    ) {
      return;
    }

    const updateRemainingTime = () => {
      const deadline = Date.parse(
        gameReconnectEvent.reconnect_deadline,
      );

      // Display the backend deadline without deciding the game result in the browser
      setRemainingSeconds(
        Math.max(
          0,
          Math.ceil(
            (deadline - Date.now()) / 1_000,
          ),
        ),
      );
    };

    updateRemainingTime();

    const timer = window.setInterval(
      updateRemainingTime,
      1_000,
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [gameReconnectEvent]);

  if (
    !authenticatedUser ||
    !gameReconnectEvent ||
    !isVisible
  ) {
    return null;
  }

  let message: string;

  if (
    gameReconnectEvent.type ===
    "game_reconnect_pending"
  ) {
    const isCurrentUserDisconnected =
      gameReconnectEvent.disconnected_user_id ===
      authenticatedUser.id;

    if (remainingSeconds === 0) {
      message = isCurrentUserDisconnected
        ? "Reconnect time expired — waiting for game result"
        : "Opponent reconnect time expired — waiting for game result";
    } else {
      const formattedTime =
        formatRemainingTime(
          remainingSeconds,
        );

      message = isCurrentUserDisconnected
        ? `Return to your game — ${formattedTime}`
        : `Opponent disconnected — ${formattedTime}`;
    }
  } else if (
    gameReconnectEvent.type ===
    "game_reconnected"
  ) {
    message =
      gameReconnectEvent.reconnected_user_id ===
      authenticatedUser.id
        ? "Game connection restored"
        : "Opponent reconnected";
  } else if (
    gameReconnectEvent.winner_id ===
    authenticatedUser.id
  ) {
    message =
      "You won — opponent did not reconnect";
  } else if (
    gameReconnectEvent.loser_id ===
    authenticatedUser.id
  ) {
    message =
      "You lost — reconnect time expired";
  } else {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[250] -translate-x-1/2">
      <div className="rounded-xl border border-neutral-700 bg-[#080808]/95 px-5 py-3 text-sm font-medium text-neutral-100 shadow-2xl backdrop-blur">
        {message}
      </div>
    </div>
  );
}