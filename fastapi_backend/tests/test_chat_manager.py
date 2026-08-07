import asyncio
import unittest

from chat.manager import GlobalChatConnectionManager
from chat.schemas import (
    AuthenticatedServerEvent,
    ChatAuthor,
    ErrorServerEvent,
)


# Fake socket used to test sending without a real WebSocket connection
class FakeWebSocket:
    def __init__(
        self,
        should_fail: bool = False,
    ) -> None:
        self.should_fail = should_fail
        self.payloads: list[dict[str, object]] = []

    async def send_json(
        self,
        payload: dict[str, object],
    ) -> None:
        # Simulate a closed or broken WebSocket when needed
        if self.should_fail:
            raise RuntimeError("socket is closed")

        # Store sent payloads so tests can inspect them
        self.payloads.append(payload)


# Fake socket that simulates a slower connected client
class SlowFakeWebSocket(FakeWebSocket):
    async def send_json(
        self,
        payload: dict[str, object],
    ) -> None:
        await asyncio.sleep(0.01)
        await super().send_json(payload)


class GlobalChatConnectionManagerTests(
    unittest.IsolatedAsyncioTestCase,
):
    async def test_activate_sends_ready_event_and_registers_socket(
        self,
    ) -> None:
        # Create one connection and one authenticated user
        manager = GlobalChatConnectionManager()
        socket = FakeWebSocket()
        user = ChatAuthor(
            id=1,
            username="alice",
        )

        await manager.activate(
            socket,
            user,
            AuthenticatedServerEvent(user=user),
        )

        # Check that authentication confirmation was sent
        self.assertEqual(
            socket.payloads[0]["type"],
            "authenticated",
        )

        # Check that the socket was added to active connections
        self.assertEqual(
            await manager.connection_count(),
            1,
        )

    async def test_broadcast_reaches_all_live_connections(
        self,
    ) -> None:
        # Register two different connected users
        manager = GlobalChatConnectionManager()
        first_socket = FakeWebSocket()
        second_socket = SlowFakeWebSocket()
        first_user = ChatAuthor(
            id=1,
            username="alice",
        )
        second_user = ChatAuthor(
            id=2,
            username="bob",
        )

        await manager.activate(
            first_socket,
            first_user,
            AuthenticatedServerEvent(
                user=first_user
            ),
        )
        await manager.activate(
            second_socket,
            second_user,
            AuthenticatedServerEvent(
                user=second_user
            ),
        )

        event = ErrorServerEvent(
            code="INTERNAL_ERROR",
            message="test-event",
        )

        # Broadcast the same event to every active connection
        await manager.broadcast(event)

        # Check that both sockets received the broadcast
        self.assertEqual(
            first_socket.payloads[-1]["type"],
            "error",
        )
        self.assertEqual(
            second_socket.payloads[-1]["type"],
            "error",
        )

        # Keep both working connections registered
        self.assertEqual(
            await manager.connection_count(),
            2,
        )

    async def test_dead_connection_does_not_block_live_client(
        self,
    ) -> None:
        # Register one socket that will fail and one healthy socket
        manager = GlobalChatConnectionManager()
        dead_socket = FakeWebSocket()
        live_socket = FakeWebSocket()
        dead_user = ChatAuthor(
            id=1,
            username="alice",
        )
        live_user = ChatAuthor(
            id=2,
            username="bob",
        )

        await manager.activate(
            dead_socket,
            dead_user,
            AuthenticatedServerEvent(
                user=dead_user
            ),
        )
        await manager.activate(
            live_socket,
            live_user,
            AuthenticatedServerEvent(
                user=live_user
            ),
        )

        # Simulate the first client disconnecting before the broadcast
        dead_socket.should_fail = True

        await manager.broadcast(
            ErrorServerEvent(
                code="INTERNAL_ERROR",
                message="test-event",
            )
        )

        # Check that the healthy client still receives the event
        self.assertEqual(
            live_socket.payloads[-1]["type"],
            "error",
        )

        # Check that the failed socket was removed
        self.assertEqual(
            await manager.connection_count(),
            1,
        )

    async def test_disconnect_is_idempotent(self) -> None:
        # Register one active connection
        manager = GlobalChatConnectionManager()
        socket = FakeWebSocket()
        user = ChatAuthor(
            id=1,
            username="alice",
        )

        await manager.activate(
            socket,
            user,
            AuthenticatedServerEvent(user=user),
        )

        # Disconnecting the same socket twice should remain safe
        await manager.disconnect(socket)
        await manager.disconnect(socket)

        self.assertEqual(
            await manager.connection_count(),
            0,
        )


if __name__ == "__main__":
    unittest.main()