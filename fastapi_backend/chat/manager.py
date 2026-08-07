from __future__ import annotations

import asyncio
import logging

from fastapi import WebSocket

from chat.schemas import ChatAuthor, ServerEvent


logger = logging.getLogger(__name__)

CHAT_SEND_TIMEOUT_SECONDS = 2.0


class GlobalChatConnectionManager:
    """Manage authenticated sockets in the current FastAPI worker"""

    def __init__(self) -> None:
        # Map every active socket to its authenticated chat user
        self._users_by_socket: dict[
            WebSocket,
            ChatAuthor,
        ] = {}

        # Protect the connection list from concurrent changes
        self._state_lock = asyncio.Lock()

        # One send lock prevents concurrent writes to the same socket
        self._send_lock = asyncio.Lock()

    async def activate(
        self,
        websocket: WebSocket,
        user: ChatAuthor,
        ready_event: ServerEvent,
    ) -> None:
        """Confirm authentication and register the socket atomically"""

        # Convert the validated server event into JSON ready data
        payload = ready_event.model_dump(mode="json")

        async with self._send_lock:
            # Send confirmation before adding the socket to active connections
            was_sent = await self._send_payload(
                websocket,
                payload,
            )

            # Do not register a socket that already failed
            if not was_sent:
                raise ConnectionError(
                    "WebSocket closed during activation"
                )

            async with self._state_lock:
                self._users_by_socket[websocket] = user
                connection_count = len(
                    self._users_by_socket
                )

        logger.info(
            "Global chat connection registered, active connections=%s",
            connection_count,
        )

    async def disconnect(
        self,
        websocket: WebSocket,
    ) -> None:
        """Remove a socket without failing when cleanup runs twice"""

        async with self._state_lock:
            # Remove the socket safely even if it was already removed
            removed_user = self._users_by_socket.pop(
                websocket,
                None,
            )
            connection_count = len(
                self._users_by_socket
            )

        # Log only when an active connection was actually removed
        if removed_user is not None:
            logger.info(
                "Global chat connection removed, active connections=%s",
                connection_count,
            )

    async def connection_count(self) -> int:
        """Return the number of active sockets"""

        async with self._state_lock:
            return len(self._users_by_socket)

    async def send_to(
        self,
        websocket: WebSocket,
        event: ServerEvent,
    ) -> bool:
        """Send one event without racing with a broadcast"""

        payload = event.model_dump(mode="json")

        # Use the same send lock as broadcasts to avoid overlapping writes
        async with self._send_lock:
            was_sent = await self._send_payload(
                websocket,
                payload,
            )

        # Clean up the socket when sending fails
        if not was_sent:
            await self.disconnect(websocket)

        return was_sent

    async def broadcast(
        self,
        event: ServerEvent,
    ) -> None:
        """Send one server event to every authenticated socket"""

        payload = event.model_dump(mode="json")

        async with self._send_lock:
            async with self._state_lock:
                # Copy the socket list so connection changes do not affect this broadcast
                sockets = list(
                    self._users_by_socket.keys()
                )

            # Skip the broadcast when nobody is connected
            if not sockets:
                return

            # Send the same event to all active sockets concurrently
            results = await asyncio.gather(
                *(
                    self._send_payload(
                        websocket,
                        payload,
                    )
                    for websocket in sockets
                ),
                return_exceptions=False,
            )

        # Find sockets that failed while receiving the broadcast
        dead_sockets = [
            websocket
            for websocket, was_sent in zip(
                sockets,
                results,
            )
            if not was_sent
        ]

        # Remove failed sockets from the active connection list
        for websocket in dead_sockets:
            await self.disconnect(websocket)

    async def _send_payload(
        self,
        websocket: WebSocket,
        payload: dict[str, object],
    ) -> bool:
        """Isolate a slow or dead client from other clients"""

        try:
            # Stop waiting when one client takes too long to receive data
            await asyncio.wait_for(
                websocket.send_json(payload),
                timeout=CHAT_SEND_TIMEOUT_SECONDS,
            )
            return True
        except (
            asyncio.TimeoutError,
            OSError,
            RuntimeError,
        ):
            # Treat common connection failures as a dead socket
            return False
        except Exception:
            # Log unexpected failures without stopping the whole broadcast
            logger.warning(
                "Global chat send failed for one connection",
                exc_info=True,
            )
            return False


# Share one connection manager instance across the current FastAPI worker
global_chat_manager = GlobalChatConnectionManager()