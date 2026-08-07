from __future__ import annotations

import asyncio
import time
from collections import deque
from collections.abc import Callable


# Allow up to five messages from one user during a ten second window
CHAT_RATE_LIMIT_MESSAGES = 5
CHAT_RATE_LIMIT_WINDOW_SECONDS = 10.0


class GlobalChatRateLimiter:
    """Limit message frequency per authenticated user"""

    def __init__(
        self,
        max_messages: int = CHAT_RATE_LIMIT_MESSAGES,
        window_seconds: float = CHAT_RATE_LIMIT_WINDOW_SECONDS,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        # Reject invalid limiter configuration
        if max_messages <= 0:
            raise ValueError("max_messages must be positive")

        if window_seconds <= 0:
            raise ValueError("window_seconds must be positive")

        self._max_messages = max_messages
        self._window_seconds = window_seconds
        self._clock = clock

        # Store recent message times separately for each authenticated user
        self._timestamps_by_user: dict[
            int,
            deque[float],
        ] = {}

        # Protect shared rate limit data from concurrent access
        self._lock = asyncio.Lock()

    async def allow(self, user_id: int) -> bool:
        """Record an allowed attempt or reject an excessive attempt"""

        now = self._clock()
        cutoff = now - self._window_seconds

        async with self._lock:
            # Create the timestamp queue when the user sends their first message
            timestamps = self._timestamps_by_user.setdefault(
                user_id,
                deque(),
            )

            # Remove message attempts that are outside the current time window
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()

            # Reject the message when the user has reached the limit
            if len(timestamps) >= self._max_messages:
                return False

            # Record the accepted message attempt
            timestamps.append(now)
            return True


# Share one rate limiter instance across the global chat
global_chat_rate_limiter = GlobalChatRateLimiter()