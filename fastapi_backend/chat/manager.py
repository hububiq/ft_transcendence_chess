from __future__ import annotations

import asyncio
import logging

from fastapi import WebSocket

from chat.schemas import (
    ChatAuthor,
    PresenceServerEvent,
    ServerEvent,
)


logger = logging.getLogger(__name__)

CHAT_SEND_TIMEOUT_SECONDS = 2.0


class GlobalChatConnectionManager:
    """Manage authenticated sockets in the current FastAPI worker"""

    def __init__(self) -> None:
        self._users_by_socket: dict[
            WebSocket,
            ChatAuthor,
        ] = {}
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

        payload = ready_event.model_dump(mode="json")

        async with self._send_lock:
            was_sent = await self._send_payload(
                websocket,
                payload,
            )

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
            removed_user = self._users_by_socket.pop(
                websocket,
                None,
            )
            connection_count = len(
                self._users_by_socket
            )

        if removed_user is not None:
            logger.info(
                "Global chat connection removed, active connections=%s",
                connection_count,
            )

    async def connection_count(self) -> int:
        """Return the number of active sockets"""

        async with self._state_lock:
            return len(self._users_by_socket)

    async def broadcast_presence(self) -> None:
        """Broadcast the current unique authenticated user list"""

        while True:
            async with self._send_lock:
                async with self._state_lock:
                    sockets = list(
                        self._users_by_socket.keys()
                    )

                    # Deduplicate users who have more than one active socket
                    users_by_id = {
                        user.id: user
                        for user in self._users_by_socket.values()
                    }

                if not sockets:
                    return

                # Keep the list stable between presence updates
                users = sorted(
                    users_by_id.values(),
                    key=lambda user: (
                        user.username.lower(),
                        user.id,
                    ),
                )

                payload = PresenceServerEvent(
                    users=users,
                ).model_dump(mode="json")

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

            dead_sockets = [
                websocket
                for websocket, was_sent in zip(
                    sockets,
                    results,
                )
                if not was_sent
            ]

            if not dead_sockets:
                return

            # Remove failed sockets before sending the corrected list
            for websocket in dead_sockets:
                await self.disconnect(websocket)

    async def send_to(
        self,
        websocket: WebSocket,
        event: ServerEvent,
    ) -> bool:
        """Send one event without racing with a broadcast"""

        payload = event.model_dump(mode="json")

        async with self._send_lock:
            was_sent = await self._send_payload(
                websocket,
                payload,
            )

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
                sockets = list(
                    self._users_by_socket.keys()
                )

            if not sockets:
                return

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

        dead_sockets = [
            websocket
            for websocket, was_sent in zip(
                sockets,
                results,
            )
            if not was_sent
        ]

        for websocket in dead_sockets:
            await self.disconnect(websocket)

        # Refresh presence when message delivery discovers dead sockets
        if dead_sockets:
            await self.broadcast_presence()

    async def _send_payload(
        self,
        websocket: WebSocket,
        payload: dict[str, object],
    ) -> bool:
        """Isolate a slow or dead client from other clients"""

        try:
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
            return False
        except Exception:
            logger.warning(
                "Global chat send failed for one connection",
                exc_info=True,
            )
            return False


global_chat_manager = GlobalChatConnectionManager()