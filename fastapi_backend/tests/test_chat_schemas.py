import unittest
from datetime import datetime, timezone
from uuid import UUID

from pydantic import ValidationError

from chat.schemas import (
    CHAT_MESSAGE_MAX_LENGTH,
    AuthenticateClientEvent,
    ChatAuthor,
    ChatMessageServerEvent,
    SendMessageClientEvent,
    parse_client_event,
)


class ClientEventParsingTests(unittest.TestCase):
    """Verify validation of events received from chat clients"""

    def test_parses_authentication_event(self) -> None:
        """Accept a correctly structured authentication event"""

        event = parse_client_event(
            {
                "type": "authenticate",
                "access_token": "signed-jwt-token",
            }
        )

        # The discriminator should select the authentication model
        self.assertIsInstance(event, AuthenticateClientEvent)

        # The token remains available for later JWT verification
        self.assertEqual(event.access_token, "signed-jwt-token")

    def test_rejects_empty_authentication_token(self) -> None:
        """Reject a token containing only whitespace"""

        with self.assertRaises(ValidationError):
            parse_client_event(
                {
                    "type": "authenticate",
                    "access_token": "   ",
                }
            )

    def test_parses_and_trims_chat_message(self) -> None:
        """Accept and normalize a valid chat message"""

        event = parse_client_event(
            {
                "type": "chat_message",
                "text": "  Hello everyone  ",
            }
        )

        # The discriminator should select the chat message model
        self.assertIsInstance(event, SendMessageClientEvent)

        # Leading and trailing whitespace should be removed
        self.assertEqual(event.text, "Hello everyone")

    def test_rejects_whitespace_only_message(self) -> None:
        """Reject a message without visible characters"""

        with self.assertRaises(ValidationError):
            parse_client_event(
                {
                    "type": "chat_message",
                    "text": "   ",
                }
            )

    def test_rejects_message_over_length_limit(self) -> None:
        """Reject a message longer than the configured maximum"""

        with self.assertRaises(ValidationError):
            parse_client_event(
                {
                    "type": "chat_message",
                    "text": "x" * (CHAT_MESSAGE_MAX_LENGTH + 1),
                }
            )

    def test_rejects_unknown_event_type(self) -> None:
        """Reject events outside the basic chat protocol"""

        with self.assertRaises(ValidationError):
            parse_client_event(
                {
                    "type": "delete_message",
                    "text": "This operation is outside the basic chat scope",
                }
            )

    def test_rejects_client_supplied_author_identity(self) -> None:
        """Reject attempts to choose the message author on the client"""

        with self.assertRaises(ValidationError):
            parse_client_event(
                {
                    "type": "chat_message",
                    "text": "I should not be able to choose my identity",

                    # These fields are forbidden because the backend
                    # must derive identity from verified authentication
                    "user_id": 999,
                    "username": "admin",
                }
            )

    def test_rejects_non_string_message_text(self) -> None:
        """Reject message text with an incorrect data type"""

        with self.assertRaises(ValidationError):
            parse_client_event(
                {
                    "type": "chat_message",

                    # Strict validation prevents conversion to string "123"
                    "text": 123,
                }
            )


class ServerEventSerializationTests(unittest.TestCase):
    """Verify events created by the backend for connected clients"""

    def test_serializes_server_confirmed_chat_message(self) -> None:
        """Serialize a server message into a JSON compatible payload"""

        event = ChatMessageServerEvent(
            # A fixed UUID makes the test deterministic
            message_id=UUID(
                "12345678-1234-5678-1234-567812345678"
            ),

            # The future authentication layer will create this author
            author=ChatAuthor(
                id=42,
                username="example-user",
            ),

            text="Hello everyone",

            # timezone.utc works in Python 3.10 and Python 3.11
            sent_at=datetime(
                2026,
                8,
                3,
                21,
                0,
                tzinfo=timezone.utc,
            ),
        )

        # JSON mode converts UUID and datetime values into strings
        payload = event.model_dump(mode="json")

        self.assertEqual(
            payload["type"],
            "chat_message",
        )

        self.assertEqual(
            payload["author"],
            {
                "id": 42,
                "username": "example-user",
            },
        )

        self.assertEqual(
            payload["text"],
            "Hello everyone",
        )

        self.assertEqual(
            payload["sent_at"],
            "2026-08-03T21:00:00Z",
        )


if __name__ == "__main__":
    # Allow direct execution in addition to unittest discovery
    unittest.main()