import unittest

from chat.rate_limiter import GlobalChatRateLimiter


# Simple clock that can be moved forward manually during tests
class MutableClock:
    def __init__(self) -> None:
        self.value = 0.0

    def __call__(self) -> float:
        return self.value


class GlobalChatRateLimiterTests(
    unittest.IsolatedAsyncioTestCase,
):
    async def test_limits_messages_per_user_across_connections(
        self,
    ) -> None:
        # Use a controlled clock so the test does not depend on real time
        clock = MutableClock()
        limiter = GlobalChatRateLimiter(
            max_messages=2,
            window_seconds=10.0,
            clock=clock,
        )

        # Allow the first two messages from the same user
        self.assertTrue(
            await limiter.allow(user_id=7)
        )
        self.assertTrue(
            await limiter.allow(user_id=7)
        )

        # Reject another message when the user reaches the limit
        self.assertFalse(
            await limiter.allow(user_id=7)
        )

        # Keep rate limits separate for different users
        self.assertTrue(
            await limiter.allow(user_id=8)
        )

    async def test_allows_user_after_window_expires(
        self,
    ) -> None:
        # Allow only one message during each ten second window
        clock = MutableClock()
        limiter = GlobalChatRateLimiter(
            max_messages=1,
            window_seconds=10.0,
            clock=clock,
        )

        self.assertTrue(
            await limiter.allow(user_id=7)
        )

        # Reject another message inside the same time window
        self.assertFalse(
            await limiter.allow(user_id=7)
        )

        # Move time past the current rate limit window
        clock.value = 10.1

        # Allow the user to send again after the window expires
        self.assertTrue(
            await limiter.allow(user_id=7)
        )


if __name__ == "__main__":
    unittest.main()