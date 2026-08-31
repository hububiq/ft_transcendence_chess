from __future__ import annotations

import asyncio
import logging
from uuid import uuid4

from fastapi import WebSocket

from chat.schemas import (
    ChatAuthor,
    ChatUserJoinedServerEvent,
    ChatUserLeftServerEvent,
    PresenceServerEvent,
    ServerEvent,
)


logger = logging.getLogger(__name__)

CHAT_SEND_TIMEOUT_SECONDS = 2.0
CHAT_PRESENCE_LEAVE_GRACE_SECONDS = 5.0

class GlobalChatConnectionManager:
    """Manage authenticated sockets in the current FastAPI worker"""

    def __init__(self) -> None:
        # Map every active socket to the user verified during authentication
        self._users_by_socket: dict[
            WebSocket,
            ChatAuthor,
        ] = {}
        self._state_lock = asyncio.Lock()

        # Serialize join and delayed leave transitions so reconnect cannot reorder them
        self._presence_transition_lock = asyncio.Lock()

        # Keep one delayed leave task per authenticated user
        self._pending_leave_tasks: dict[
            int,
            asyncio.Task[None],
        ] = {}

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
        pending_leave_task: asyncio.Task[None] | None = None
        should_announce_join = False

        # Serialize presence transitions with delayed leave completion
        async with self._presence_transition_lock:
            async with self._send_lock:
                # Confirm authentication before exposing the socket as active
                was_sent = await self._send_payload(
                    websocket,
                    payload,
                )

                if not was_sent:
                    raise ConnectionError(
                        "WebSocket closed during activation"
                    )

                # Register only sockets that successfully received the auth response
                async with self._state_lock:
                    had_active_connection = any(
                        active_user.id == user.id
                        for active_user
                        in self._users_by_socket.values()
                    )

                    pending_leave_task = (
                        self._pending_leave_tasks.pop(
                            user.id,
                            None,
                        )
                    )

                    self._users_by_socket[websocket] = user
                    connection_count = len(
                        self._users_by_socket
                    )

                    # A reconnect during the grace period continues the same presence session
                    should_announce_join = (
                        not had_active_connection
                        and pending_leave_task is None
                    )

            if pending_leave_task is not None:
                pending_leave_task.cancel()

            if should_announce_join:
                await self.broadcast(
                    ChatUserJoinedServerEvent(
                        event_id=uuid4(),
                        user=user,
                    )
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

        # Removing by socket keeps multiple tabs from affecting each other
        async with self._state_lock:
            removed_user = self._users_by_socket.pop(
                websocket,
                None,
            )
            connection_count = len(
                self._users_by_socket
            )

            if removed_user is not None:
                has_other_connection = any(
                    active_user.id == removed_user.id
                    for active_user
                    in self._users_by_socket.values()
                )

                # Start the grace period only after the user's last socket disappears
                if (
                    not has_other_connection
                    and removed_user.id
                    not in self._pending_leave_tasks
                ):
                    self._pending_leave_tasks[
                        removed_user.id
                    ] = asyncio.create_task(
                        self._announce_leave_after_grace(
                            removed_user
                        )
                    )

        if removed_user is not None:
            logger.info(
                "Global chat connection removed, active connections=%s",
                connection_count,
            )

    async def _announce_leave_after_grace(
        self,
        user: ChatAuthor,
    ) -> None:
        """Announce leave only if the user stays disconnected through the grace period"""

        current_task = asyncio.current_task()

        if current_task is None:
            return

        try:
            await asyncio.sleep(
                CHAT_PRESENCE_LEAVE_GRACE_SECONDS
            )

            # Serialize the final leave decision with any concurrent reconnect
            async with self._presence_transition_lock:
                async with self._state_lock:
                    if (
                        self._pending_leave_tasks.get(
                            user.id
                        )
                        is not current_task
                    ):
                        return

                    has_active_connection = any(
                        active_user.id == user.id
                        for active_user
                        in self._users_by_socket.values()
                    )

                    if has_active_connection:
                        self._pending_leave_tasks.pop(
                            user.id,
                            None,
                        )
                        return

                    self._pending_leave_tasks.pop(
                        user.id,
                        None,
                    )

                await self.broadcast(
                    ChatUserLeftServerEvent(
                        event_id=uuid4(),
                        user=user,
                    )
                )

        except asyncio.CancelledError:
            # Reconnect during the grace period intentionally cancels the leave
            return

    async def connection_count(self) -> int:
        """Return the number of active sockets"""

        async with self._state_lock:
            return len(self._users_by_socket)

    async def broadcast_presence(self) -> None:
        """Broadcast the current unique authenticated user list"""

        # Repeat when dead sockets change the presence snapshot during delivery
        while True:
            async with self._send_lock:
                # Read sockets and users from the same protected state snapshot
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

                # Presence contains only public identities derived from authenticated sockets
                payload = PresenceServerEvent(
                    users=users,
                ).model_dump(mode="json")

                # Send the same presence snapshot to every authenticated socket
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

        # Failed delivery also removes the socket from active connections
        if not was_sent:
            await self.disconnect(websocket)

        return was_sent
    
    async def send_to_users(
        self,
        user_ids: set[int],
        event: ServerEvent,
    ) -> None:
        """Send one event to every active socket owned by selected users"""

        if not user_ids:
            return

        payload = event.model_dump(mode="json")

        async with self._send_lock:
            async with self._state_lock:
                # Include every active tab that belongs to an affected user
                sockets = [
                    websocket
                    for websocket, user
                    in self._users_by_socket.items()
                    if user.id in user_ids
                ]

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

        # Refresh presence when targeted delivery discovers dead sockets
        if dead_sockets:
            await self.broadcast_presence()

    async def broadcast(
        self,
        event: ServerEvent,
    ) -> None:
        """Send one server event to every authenticated socket"""

        payload = event.model_dump(mode="json")

        async with self._send_lock:
            # Copy the current socket list without holding the state lock during network writes
            async with self._state_lock:
                sockets = list(
                    self._users_by_socket.keys()
                )

            if not sockets:
                return

            # Slow or dead clients are isolated by the per-send timeout
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
            # Limit one network write so a dead client cannot block broadcasts
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