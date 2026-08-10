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


logger = logging.getLogger(__name__)

# Register the WebSocket endpoint as part of the global chat router
router = APIRouter(tags=["global-chat"])

# Limit how long a new connection can wait before authenticating
AUTHENTICATION_TIMEOUT_SECONDS = 10.0

# Reject client frames that are larger than the allowed chat payload size
MAX_CLIENT_FRAME_BYTES = 8_192

# Close connections that break authentication or chat rules
POLICY_VIOLATION_CLOSE_CODE = 1008

# Close connections when an unexpected server error happens
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

    # Use the same server error format before the socket is registered
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
        # Ignore closing a socket that is already closed
        return


async def _receive_json_payload(
    websocket: WebSocket,
) -> object:
    """Receive a bounded text frame and decode its JSON value"""

    # Read one raw WebSocket frame from the client
    message = await websocket.receive()
    message_type = message.get("type")

    # Convert a client disconnect into the standard FastAPI exception
    if message_type == "websocket.disconnect":
        raise WebSocketDisconnect(
            code=message.get("code", 1000)
        )

    # Reject unexpected WebSocket message types
    if message_type != "websocket.receive":
        raise ValueError(
            "Unsupported WebSocket message type"
        )

    raw_text = message.get("text")

    # Accept only text frames because chat events use JSON text
    if not isinstance(raw_text, str):
        raise ValueError(
            "Only text WebSocket frames are supported"
        )

    # Measure the real UTF-8 payload size before parsing JSON
    raw_size = len(raw_text.encode("utf-8"))

    # Reject oversized frames before doing further processing
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

    # Check validation details to return a more useful public error
    for item in error.errors():
        location = item.get("loc", ())
        error_type = item.get("type")

        # Return a specific error for an empty message
        if (
            "text" in location
            and error_type == "string_too_short"
        ):
            return ErrorServerEvent(
                code="EMPTY_MESSAGE",
                message="Message cannot be empty",
            )

        # Return a specific error for a message above the text limit
        if (
            "text" in location
            and error_type == "string_too_long"
        ):
            return ErrorServerEvent(
                code="MESSAGE_TOO_LONG",
                message="Message is too long",
            )

    # Hide internal validation details behind a safe generic error
    return ErrorServerEvent(
        code="INVALID_EVENT",
        message="Unsupported or invalid chat event",
    )


async def _authenticate_connection(
    websocket: WebSocket,
) -> AuthenticatedChatUser | None:
    """Require authentication as the first client event"""

    try:
        # Wait only a limited time for the first authentication event
        payload = await asyncio.wait_for(
            _receive_json_payload(websocket),
            timeout=AUTHENTICATION_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        # Reject clients that do not authenticate in time
        await _send_pre_auth_error(
            websocket,
            code="AUTH_REQUIRED",
            message="Authentication is required",
        )
        await _close_safely(
            websocket,
            POLICY_VIOLATION_CLOSE_CODE,
        )
        return None
    except json.JSONDecodeError:
        # Reject malformed JSON during authentication
        await _send_pre_auth_error(
            websocket,
            code="INVALID_JSON",
            message="Invalid JSON payload",
        )
        await _close_safely(
            websocket,
            POLICY_VIOLATION_CLOSE_CODE,
        )
        return None
    except ValueError:
        # Reject unsupported frames or invalid payload structure
        await _send_pre_auth_error(
            websocket,
            code="INVALID_EVENT",
            message="Unsupported or invalid chat event",
        )
        await _close_safely(
            websocket,
            POLICY_VIOLATION_CLOSE_CODE,
        )
        return None

    try:
        # Validate the first payload using the shared chat event schemas
        event = parse_client_event(payload)
    except ValidationError:
        # Use an authentication error when authentication itself was malformed
        if _is_authentication_payload(payload):
            error_code: ChatErrorCode = "AUTH_INVALID"
            error_message = "Authentication is invalid"
        else:
            # Require authentication when another event was sent first
            error_code = "AUTH_REQUIRED"
            error_message = (
                "Authentication must be the first event"
            )

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

    # Do not allow any other event before authentication
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

    try:
        # Verify the token and get the trusted user identity from Django
        return await authenticate_chat_user(
            event.access_token
        )
    except ChatAuthenticationError as error:
        # Send only the safe public authentication error to the client
        await _send_pre_auth_error(
            websocket,
            code=error.code,
            message=error.public_message,
        )

        # Use a server error close code only for internal authentication failures
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

    # Send through the manager so socket writes stay synchronized
    return await global_chat_manager.send_to(
        websocket,
        ErrorServerEvent(
            code=code,
            message=message,
        ),
    )


@router.websocket("/ws/chat")
async def global_chat_socket(
    websocket: WebSocket,
) -> None:
    """Run the authenticated global chat connection lifecycle"""

    # Complete the WebSocket handshake before receiving chat events
    await websocket.accept()

    # Track whether this socket needs manager cleanup later
    is_registered = False

    try:
        # Require successful authentication before joining the active chat
        authenticated_user = (
            await _authenticate_connection(websocket)
        )

        if authenticated_user is None:
            return

        # Use only the trusted user identity returned by authentication
        user = authenticated_user.author

        # Confirm authentication and register the socket for broadcasts
        await global_chat_manager.activate(
            websocket,
            user,
            AuthenticatedServerEvent(user=user),
        )
        is_registered = True

        # Keep receiving chat events until the connection ends
        while True:
            # Calculate how long the current access token remains valid
            seconds_until_expiry = (
                authenticated_user.seconds_until_expiry()
            )

            # Stop the connection when authentication has already expired
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
                return

            try:
                # Never wait for the next message longer than the token remains valid
                payload = await asyncio.wait_for(
                    _receive_json_payload(websocket),
                    timeout=seconds_until_expiry,
                )
            except asyncio.TimeoutError:
                # Expire an idle connection when its token reaches expiration
                await _send_registered_error(
                    websocket,
                    code="AUTH_EXPIRED",
                    message="Authentication has expired",
                )
                await _close_safely(
                    websocket,
                    POLICY_VIOLATION_CLOSE_CODE,
                )
                return
            except json.JSONDecodeError:
                # Report malformed JSON without closing a valid chat connection
                was_sent = await _send_registered_error(
                    websocket,
                    code="INVALID_JSON",
                    message="Invalid JSON payload",
                )

                if not was_sent:
                    return

                continue
            except ValueError:
                # Report unsupported frames or invalid payload structure
                was_sent = await _send_registered_error(
                    websocket,
                    code="INVALID_EVENT",
                    message=(
                        "Unsupported or invalid chat event"
                    ),
                )

                if not was_sent:
                    return

                continue

            # Check token expiry again after waiting for the client message
            if (
                authenticated_user.seconds_until_expiry()
                <= 0
            ):
                await _send_registered_error(
                    websocket,
                    code="AUTH_EXPIRED",
                    message="Authentication has expired",
                )
                await _close_safely(
                    websocket,
                    POLICY_VIOLATION_CLOSE_CODE,
                )
                return

            try:
                # Parse and validate the received event before using its data
                event = parse_client_event(payload)
            except ValidationError as error:
                # Convert validation details into the public chat error format
                was_sent = await global_chat_manager.send_to(
                    websocket,
                    _validation_error_event(error),
                )

                if not was_sent:
                    return

                continue

            # Authentication is allowed only once at the start of the connection
            if isinstance(event, AuthenticateClientEvent):
                was_sent = await _send_registered_error(
                    websocket,
                    code="INVALID_EVENT",
                    message=(
                        "Connection is already authenticated"
                    ),
                )

                if not was_sent:
                    return

                continue

            # Reject any validated client event that is not a chat message
            if not isinstance(event, SendMessageClientEvent):
                was_sent = await _send_registered_error(
                    websocket,
                    code="INVALID_EVENT",
                    message=(
                        "Unsupported or invalid chat event"
                    ),
                )

                if not was_sent:
                    return

                continue

            # Apply the message limit to the authenticated user identity
            is_allowed = (
                await global_chat_rate_limiter.allow(
                    user.id
                )
            )

            if not is_allowed:
                # Reject excessive messages without disconnecting the user
                was_sent = await _send_registered_error(
                    websocket,
                    code="RATE_LIMITED",
                    message=(
                        "You are sending messages too quickly"
                    ),
                )

                if not was_sent:
                    return

                continue

            # Create message metadata on the server instead of trusting the client
            message_event = ChatMessageServerEvent(
                message_id=uuid4(),
                author=user,
                text=event.text,
                sent_at=datetime.now(timezone.utc),
            )

            # Send the validated message to every authenticated connection
            await global_chat_manager.broadcast(
                message_event
            )

    except WebSocketDisconnect:
        # Normal client disconnect does not need to be reported as an error
        return
    except Exception:
        # Never log tokens or raw client payloads
        logger.exception(
            "Unexpected global chat WebSocket error"
        )

        try:
            # Use the manager only when the socket has already been registered
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
            # Do not hide the original failure if sending the error also fails
            pass

        await _close_safely(
            websocket,
            INTERNAL_ERROR_CLOSE_CODE,
        )
    finally:
        # Always remove registered sockets when their lifecycle finishes
        if is_registered:
            await global_chat_manager.disconnect(
                websocket
            )