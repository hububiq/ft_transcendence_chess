import unittest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import jwt

from chat.authentication import (
    ChatAuthenticationError,
    DjangoCurrentUserResponse,
    authenticate_chat_user,
)


# Use a far-future timestamp so valid-token tests do not expire
FUTURE_EXPIRATION_TIMESTAMP = 4_102_444_800


# Test asynchronous chat authentication behavior in isolation
class ChatAuthenticationTests(
    unittest.IsolatedAsyncioTestCase,
):
    # Replace the real Django request with an asynchronous mock
    @patch(
        "chat.authentication._fetch_current_user",
        new_callable=AsyncMock,
    )

    # Replace JWT decoding so the test controls the token payload
    @patch("chat.authentication.jwt.decode")
    async def test_builds_author_from_verified_token_and_django_user(
        self,
        decode_mock,
        fetch_user_mock,
    ) -> None:
        # Simulate a valid decoded JWT payload
        decode_mock.return_value = {
            "user_id": 42,
            "exp": FUTURE_EXPIRATION_TIMESTAMP,
        }

        # Simulate trusted current-user data returned by Django
        fetch_user_mock.return_value = (
            DjangoCurrentUserResponse(
                id=42,
                username="alice",
            )
        )

        # Authenticate the user with the mocked JWT and Django response
        authenticated_user = await authenticate_chat_user(
            "valid-token"
        )

        # Verify that the trusted author id comes from validated backend data
        self.assertEqual(
            authenticated_user.author.id,
            42,
        )

        # Verify that the trusted username comes from Django
        self.assertEqual(
            authenticated_user.author.username,
            "alice",
        )

        # Verify that the token expiration is converted to UTC datetime
        self.assertEqual(
            authenticated_user.token_expires_at,
            datetime.fromtimestamp(
                FUTURE_EXPIRATION_TIMESTAMP,
                tz=timezone.utc,
            ),
        )

        # Verify that Django was queried with the same access token
        fetch_user_mock.assert_awaited_once_with(
            "valid-token"
        )

    # Replace JWT decoding to simulate an expired token
    @patch("chat.authentication.jwt.decode")
    async def test_rejects_expired_token(
        self,
        decode_mock,
    ) -> None:
        # Simulate the JWT library raising an expiration error
        decode_mock.side_effect = (
            jwt.ExpiredSignatureError()
        )

        # Verify that expired tokens raise the chat authentication error
        with self.assertRaises(
            ChatAuthenticationError
        ) as context:
            await authenticate_chat_user(
                "expired-token"
            )

        # Verify that the public error code identifies token expiration
        self.assertEqual(
            context.exception.code,
            "AUTH_EXPIRED",
        )

    # Replace JWT decoding to simulate a malformed or invalid token
    @patch("chat.authentication.jwt.decode")
    async def test_rejects_invalid_token(
        self,
        decode_mock,
    ) -> None:
        # Simulate the JWT library rejecting the token
        decode_mock.side_effect = (
            jwt.InvalidTokenError()
        )

        # Verify that invalid tokens raise the chat authentication error
        with self.assertRaises(
            ChatAuthenticationError
        ) as context:
            await authenticate_chat_user(
                "invalid-token"
            )

        # Verify that the public error code identifies invalid authentication
        self.assertEqual(
            context.exception.code,
            "AUTH_INVALID",
        )

    # Replace the real Django request with an asynchronous mock
    @patch(
        "chat.authentication._fetch_current_user",
        new_callable=AsyncMock,
    )

    # Replace JWT decoding so the test controls the token identity
    @patch("chat.authentication.jwt.decode")
    async def test_rejects_identity_mismatch(
        self,
        decode_mock,
        fetch_user_mock,
    ) -> None:
        # Simulate a token that belongs to user 42
        decode_mock.return_value = {
            "user_id": 42,
            "exp": FUTURE_EXPIRATION_TIMESTAMP,
        }

        # Simulate Django returning a different current user
        fetch_user_mock.return_value = (
            DjangoCurrentUserResponse(
                id=99,
                username="mallory",
            )
        )

        # Verify that mismatched identities are rejected
        with self.assertRaises(
            ChatAuthenticationError
        ) as context:
            await authenticate_chat_user(
                "valid-token"
            )

        # Verify that identity mismatches use the safe invalid-auth code
        self.assertEqual(
            context.exception.code,
            "AUTH_INVALID",
        )

    # Replace JWT decoding so the test can omit the expiration claim
    @patch("chat.authentication.jwt.decode")
    async def test_rejects_token_without_expiration(
        self,
        decode_mock,
    ) -> None:
        # Simulate a token payload without the required exp claim
        decode_mock.return_value = {
            "user_id": 42,
        }

        # Verify that missing required claims reject authentication
        with self.assertRaises(
            ChatAuthenticationError
        ) as context:
            await authenticate_chat_user(
                "token-without-expiration"
            )

        # Verify that the missing expiration is reported as invalid authentication
        self.assertEqual(
            context.exception.code,
            "AUTH_INVALID",
        )


# Allow this file to run directly with python
if __name__ == "__main__":
    unittest.main()