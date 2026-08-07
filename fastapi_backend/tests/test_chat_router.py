import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from chat.authentication import (
    AuthenticatedChatUser,
    ChatAuthenticationError,
)
from chat.manager import GlobalChatConnectionManager
from chat.router import router
from chat.schemas import ChatAuthor


# Keep test authentication valid far beyond the current test date
FUTURE_TOKEN_EXPIRY = datetime(
    2100,
    1,
    1,
    tzinfo=timezone.utc,
)


class GlobalChatRouterTests(unittest.TestCase):
    def setUp(self) -> None:
        # Use a fresh connection manager for every test
        self.manager = GlobalChatConnectionManager()

        # Allow messages by default without using the real rate limiter
        self.rate_limiter = SimpleNamespace(
            allow=AsyncMock(return_value=True)
        )

        # Replace shared chat dependencies with isolated test versions
        self.manager_patcher = patch(
            "chat.router.global_chat_manager",
            self.manager,
        )
        self.rate_limiter_patcher = patch(
            "chat.router.global_chat_rate_limiter",
            self.rate_limiter,
        )
        self.authenticate_patcher = patch(
            "chat.router.authenticate_chat_user",
            new_callable=AsyncMock,
        )

        # Start all dependency replacements before creating the client
        self.manager_patcher.start()
        self.rate_limiter_patcher.start()
        self.authenticate_mock = (
            self.authenticate_patcher.start()
        )

        # Create a minimal FastAPI app containing only the chat router
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)

    def tearDown(self) -> None:
        # Clean up the test client and restore patched dependencies
        self.client.close()
        self.authenticate_patcher.stop()
        self.rate_limiter_patcher.stop()
        self.manager_patcher.stop()

    def _authenticated_user(
        self,
        user_id: int = 1,
        username: str = "alice",
    ) -> AuthenticatedChatUser:
        # Build a trusted authenticated user for router tests
        return AuthenticatedChatUser(
            author=ChatAuthor(
                id=user_id,
                username=username,
            ),
            token_expires_at=FUTURE_TOKEN_EXPIRY,
        )

    def test_requires_authentication_as_first_event(
        self,
    ) -> None:
        # Open the real chat WebSocket route without authenticating first
        with self.client.websocket_connect(
            "/ws/chat"
        ) as socket:
            socket.send_json(
                {
                    "type": "chat_message",
                    "text": "not authenticated",
                }
            )

            error = socket.receive_json()

            # Check that messages cannot be sent before authentication
            self.assertEqual(
                error["type"],
                "error",
            )
            self.assertEqual(
                error["code"],
                "AUTH_REQUIRED",
            )

            # Authentication should not run for a chat message sent first
            self.authenticate_mock.assert_not_awaited()

    def test_authenticates_and_broadcasts_server_message(
        self,
    ) -> None:
        # Make authentication return a known trusted user
        self.authenticate_mock.return_value = (
            self._authenticated_user()
        )

        with self.client.websocket_connect(
            "/ws/chat"
        ) as socket:
            # Send authentication as the first client event
            socket.send_json(
                {
                    "type": "authenticate",
                    "access_token": "valid-token",
                }
            )

            authenticated = socket.receive_json()

            # Check that the server confirms successful authentication
            self.assertEqual(
                authenticated["type"],
                "authenticated",
            )

            # Send a normal chat message after authentication
            socket.send_json(
                {
                    "type": "chat_message",
                    "text": "Hello everyone",
                }
            )

            message = socket.receive_json()

            # Check that the server broadcasts a chat message event
            self.assertEqual(
                message["type"],
                "chat_message",
            )

            # Check that the author comes from the authenticated user
            self.assertEqual(
                message["author"],
                {
                    "id": 1,
                    "username": "alice",
                },
            )

            self.assertEqual(
                message["text"],
                "Hello everyone",
            )

            # Check that message metadata is created by the server
            self.assertIn(
                "message_id",
                message,
            )
            self.assertIn(
                "sent_at",
                message,
            )

    def test_rejects_expired_authentication(
        self,
    ) -> None:
        # Simulate the authentication layer rejecting an expired token
        self.authenticate_mock.side_effect = (
            ChatAuthenticationError(
                code="AUTH_EXPIRED",
                public_message=(
                    "Authentication has expired"
                ),
            )
        )

        with self.client.websocket_connect(
            "/ws/chat"
        ) as socket:
            socket.send_json(
                {
                    "type": "authenticate",
                    "access_token": "expired-token",
                }
            )

            error = socket.receive_json()

            # Check that the router returns the safe authentication error
            self.assertEqual(
                error["code"],
                "AUTH_EXPIRED",
            )

    def test_returns_invalid_json_without_crashing(
        self,
    ) -> None:
        # Start with a successfully authenticated connection
        self.authenticate_mock.return_value = (
            self._authenticated_user()
        )

        with self.client.websocket_connect(
            "/ws/chat"
        ) as socket:
            socket.send_json(
                {
                    "type": "authenticate",
                    "access_token": "valid-token",
                }
            )
            socket.receive_json()

            # Send malformed JSON after authentication
            socket.send_text("{")
            error = socket.receive_json()

            # Check that invalid JSON returns an error instead of crashing
            self.assertEqual(
                error["code"],
                "INVALID_JSON",
            )


if __name__ == "__main__":
    unittest.main()