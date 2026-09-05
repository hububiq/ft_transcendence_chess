from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from chat.authentication import (
    AuthenticatedChatUser,
    ChatAuthenticationError,
    authenticate_chat_user,
)
from chat.manager import global_chat_manager
from chat.rate_limiter import global_chat_rate_limiter
from chat.schemas import (
    AuthenticateClientEvent,
    AuthenticatedServerEvent,
    ChatErrorCode,
    ChatMessageServerEvent,
    ErrorServerEvent,
    SendMessageClientEvent,
    ServerEvent,
    parse_client_event,
)
from reconnect_service import (
    get_reconnect_pending_events_for_user,
)


logger = logging.getLogger(__name__)

router = APIRouter(tags=["global-chat"])

AUTHENTICATION_TIMEOUT_SECONDS = 10.0
MAX_CLIENT_FRAME_BYTES = 8_192
POLICY_VIOLATION_CLOSE_CODE = 1008
INTERNAL_ERROR_CLOSE_CODE = 1011


async def _send_pre_auth_event(
    websocket: WebSocket,
    event: ServerEvent,
) -> None:
    """Send an event before the socket enters the manager"""

    await websocket.send_json(
        event.model_dump(mode="json")
    )


async def _send_pre_auth_error(
    websocket: WebSocket,
    code: ChatErrorCode,
    message: str,
) -> None:
    """Send a safe error before authentication finishes"""

    # Pre-auth errors cannot use the connection manager yet
    await _send_pre_auth_event(
        websocket,
        ErrorServerEvent(
            code=code,
            message=message,
        ),
    )


async def _close_safely(
    websocket: WebSocket,
    code: int,
) -> None:
    """Close the socket without hiding the original error"""

    try:
        await websocket.close(code=code)
    except RuntimeError:
        return


async def _receive_json_payload(
    websocket: WebSocket,
) -> object:
    """Receive a bounded text frame and decode its JSON value"""

    message = await websocket.receive()
    message_type = message.get("type")

    if message_type == "websocket.disconnect":
        raise WebSocketDisconnect(
            code=message.get("code", 1000)
        )

    if message_type != "websocket.receive":
        raise ValueError(
            "Unsupported WebSocket message type"
        )

    raw_text = message.get("text")

    # Binary frames are rejected because the protocol accepts JSON text only
    if not isinstance(raw_text, str):
        raise ValueError(
            "Only text WebSocket frames are supported"
        )

    # Limit the raw frame before JSON parsing to avoid oversized client payloads
    raw_size = len(raw_text.encode("utf-8"))

    if raw_size > MAX_CLIENT_FRAME_BYTES:
        raise ValueError(
            "WebSocket frame is too large"
        )

    return json.loads(raw_text)


def _is_authentication_payload(
    payload: object,
) -> bool:
    """Check whether a rejected payload attempted authentication"""

    return (
        isinstance(payload, dict)
        and payload.get("type") == "authenticate"
    )


def _validation_error_event(
    error: ValidationError,
) -> ErrorServerEvent:
    """Map Pydantic details to the public chat error contract"""

    # Convert internal validation details into stable client-safe error codes
    for item in error.errors():
        location = item.get("loc", ())
        error_type = item.get("type")

        if (
            "text" in location
            and error_type == "string_too_short"
        ):
            return ErrorServerEvent(
                code="EMPTY_MESSAGE",
                message="Message cannot be empty",
            )

        if (
            "text" in location
            and error_type == "string_too_long"
        ):
            return ErrorServerEvent(
                code="MESSAGE_TOO_LONG",
                message="Message is too long",
            )

    return ErrorServerEvent(
        code="INVALID_EVENT",
        message="Unsupported or invalid chat event",
    )


async def _receive_authentication_payload(
    websocket: WebSocket,
) -> tuple[bool, object]:
    # The first frame must arrive within the authentication timeout
    try:
        payload = await asyncio.wait_for(
            _receive_json_payload(websocket),
            timeout=AUTHENTICATION_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        await _send_pre_auth_error(
            websocket,
            code="AUTH_REQUIRED",
            message="Authentication is required",
        )
        await _close_safely(
            websocket,
            POLICY_VIOLATION_CLOSE_CODE,
        )
        return False, None
    except json.JSONDecodeError:
        await _send_pre_auth_error(
            websocket,
            code="INVALID_JSON",
            message="Invalid JSON payload",
        )
        await _close_safely(
            websocket,
            POLICY_VIOLATION_CLOSE_CODE,
        )
        return False, None
    except ValueError:
        await _send_pre_auth_error(
            websocket,
            code="INVALID_EVENT",
            message="Unsupported or invalid chat event",
        )
        await _close_safely(
            websocket,
            POLICY_VIOLATION_CLOSE_CODE,
        )
        return False, None

    return True, payload


async def _parse_authentication_event(
    websocket: WebSocket,
    payload: object,
) -> AuthenticateClientEvent | None:
    try:
        event = parse_client_event(payload)
    except ValidationError:
        # Distinguish malformed authentication from a missing first auth event
        if _is_authentication_payload(payload):
            error_code: ChatErrorCode = "AUTH_INVALID"
            error_message = "Authentication is invalid"
        else:
            error_code = "AUTH_REQUIRED"
            error_message = "Authentication must be the first event"

        await _send_pre_auth_error(
            websocket,
            code=error_code,
            message=error_message,
        )
        await _close_safely(
            websocket,
            POLICY_VIOLATION_CLOSE_CODE,
        )
        return None

    # No chat event is accepted before successful authentication
    if not isinstance(event, AuthenticateClientEvent):
        await _send_pre_auth_error(
            websocket,
            code="AUTH_REQUIRED",
            message="Authentication must be the first event",
        )
        await _close_safely(
            websocket,
            POLICY_VIOLATION_CLOSE_CODE,
        )
        return None

    return event


async def _authenticate_connection(
    websocket: WebSocket,
) -> AuthenticatedChatUser | None:
    """Require authentication as the first client event"""

    has_payload, payload = await _receive_authentication_payload(websocket)

    if not has_payload:
        return None

    event = await _parse_authentication_event(
        websocket,
        payload,
    )

    if event is None:
        return None

    try:
        # Resolve the trusted user identity from the verified access token
        return await authenticate_chat_user(
            event.access_token
        )
    except ChatAuthenticationError as error:
        await _send_pre_auth_error(
            websocket,
            code=error.code,
            message=error.public_message,
        )

        close_code = (
            INTERNAL_ERROR_CLOSE_CODE
            if error.code == "INTERNAL_ERROR"
            else POLICY_VIOLATION_CLOSE_CODE
        )

        await _close_safely(
            websocket,
            close_code,
        )
        return None


async def _send_registered_error(
    websocket: WebSocket,
    code: ChatErrorCode,
    message: str,
) -> bool:
    """Send an error through the manager send lock"""

    # Registered sockets use the same serialized send path as broadcasts
    return await global_chat_manager.send_to(
        websocket,
        ErrorServerEvent(
            code=code,
            message=message,
        ),
    )


async def _restore_pending_reconnect_events(
    websocket: WebSocket,
    user_id: int,
) -> bool:
    pending_reconnect_events = (
        await get_reconnect_pending_events_for_user(
            user_id,
        )
    )

    for pending_event in pending_reconnect_events:
        was_sent = await global_chat_manager.send_to(
            websocket,
            pending_event,
        )

        if not was_sent:
            return False

    return True


async def _receive_registered_payload(
    websocket: WebSocket,
    authenticated_user: AuthenticatedChatUser,
) -> tuple[bool, object]:
    while True:
        # Limit the connection lifetime to the lifetime of the access token
        seconds_until_expiry = (
            authenticated_user.seconds_until_expiry()
        )

        if seconds_until_expiry <= 0:
            await _send_registered_error(
                websocket,
                code="AUTH_EXPIRED",
                message="Authentication has expired",
            )
            await _close_safely(
                websocket,
                POLICY_VIOLATION_CLOSE_CODE,
            )
            return False, None

        try:
            # Waiting only until token expiry prevents stale authenticated sockets
            payload = await asyncio.wait_for(
                _receive_json_payload(websocket),
                timeout=seconds_until_expiry,
            )
        except asyncio.TimeoutError:
            await _send_registered_error(
                websocket,
                code="AUTH_EXPIRED",
                message="Authentication has expired",
            )
            await _close_safely(
                websocket,
                POLICY_VIOLATION_CLOSE_CODE,
            )
            return False, None
        except json.JSONDecodeError:
            was_sent = await _send_registered_error(
                websocket,
                code="INVALID_JSON",
                message="Invalid JSON payload",
            )

            if not was_sent:
                return False, None

            continue
        except ValueError:
            was_sent = await _send_registered_error(
                websocket,
                code="INVALID_EVENT",
                message="Unsupported or invalid chat event",
            )

            if not was_sent:
                return False, None

            continue

        # Check expiry again because the token may expire while data arrives
        if authenticated_user.seconds_until_expiry() <= 0:
            await _send_registered_error(
                websocket,
                code="AUTH_EXPIRED",
                message="Authentication has expired",
            )
            await _close_safely(
                websocket,
                POLICY_VIOLATION_CLOSE_CODE,
            )
            return False, None

        return True, payload


async def _handle_registered_chat_payload(
    websocket: WebSocket,
    authenticated_user: AuthenticatedChatUser,
    payload: object,
) -> bool:
    user = authenticated_user.author

    try:
        # Validate every decoded payload against the shared client event schema
        event = parse_client_event(payload)
    except ValidationError as error:
        return await global_chat_manager.send_to(
            websocket,
            _validation_error_event(error),
        )

    # Authentication is allowed only once at the beginning of the connection
    if isinstance(event, AuthenticateClientEvent):
        return await _send_registered_error(
            websocket,
            code="INVALID_EVENT",
            message="Connection is already authenticated",
        )

    # The basic global chat accepts only validated message events after auth
    if not isinstance(event, SendMessageClientEvent):
        return await _send_registered_error(
            websocket,
            code="INVALID_EVENT",
            message="Unsupported or invalid chat event",
        )

    # Rate limiting is keyed by the authenticated backend user identifier
    is_allowed = await global_chat_rate_limiter.allow(
        user.id
    )

    if not is_allowed:
        return await _send_registered_error(
            websocket,
            code="RATE_LIMITED",
            message="You are sending messages too quickly",
        )

    # The server assigns message identity author and timestamp
    message_event = ChatMessageServerEvent(
        message_id=uuid4(),
        author=user,
        text=event.text,
        sent_at=datetime.now(timezone.utc),
    )

    # Broadcast only server-created messages to authenticated sockets
    await global_chat_manager.broadcast(
        message_event
    )

    return True


@router.websocket("/ws/chat")
async def global_chat_socket(
    websocket: WebSocket,
) -> None:
    """Run the authenticated global chat connection lifecycle"""

    # Accept the transport first but do not register the user before authentication
    await websocket.accept()

    is_registered = False

    try:
        authenticated_user = (
            await _authenticate_connection(websocket)
        )

        if authenticated_user is None:
            return

        # The author comes only from verified backend authentication
        user = authenticated_user.author

        # Register the socket only after authentication succeeds
        try:
            await global_chat_manager.activate(
                websocket,
                user,
                AuthenticatedServerEvent(user=user),
            )
        except ConnectionError:
            return

        is_registered = True

        # Tell all clients that the logged user list changed
        await global_chat_manager.broadcast_presence()

        # Restore an active reconnect countdown after the application socket reconnects
        reconnect_events_restored = await _restore_pending_reconnect_events(
            websocket,
            user.id,
        )

        if not reconnect_events_restored:
            return

        while True:
            has_payload, payload = await _receive_registered_payload(
                websocket,
                authenticated_user,
            )

            if not has_payload:
                return

            handled = await _handle_registered_chat_payload(
                websocket,
                authenticated_user,
                payload,
            )

            if not handled:
                return

    except WebSocketDisconnect:
        return
    except Exception:
        # Never log tokens or raw client payloads
        logger.exception(
            "Unexpected global chat WebSocket error"
        )

        try:
            if is_registered:
                await _send_registered_error(
                    websocket,
                    code="INTERNAL_ERROR",
                    message="Unexpected chat error",
                )
            else:
                await _send_pre_auth_error(
                    websocket,
                    code="INTERNAL_ERROR",
                    message="Unexpected chat error",
                )
        except Exception:
            pass

        await _close_safely(
            websocket,
            INTERNAL_ERROR_CLOSE_CODE,
        )
    finally:
        if is_registered:
            # Cleanup always removes the socket even after errors or normal disconnects
            await global_chat_manager.disconnect(
                websocket
            )

            # Tell remaining clients that the logged user list changed
            await global_chat_manager.broadcast_presence()