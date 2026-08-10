from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Literal

import httpx
import jwt
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from chat.schemas import ChatAuthor, USERNAME_MAX_LENGTH
from config import settings


# Use the internal Docker service address to reach Django
DJANGO_CURRENT_USER_URL = os.getenv(
    "CHAT_DJANGO_CURRENT_USER_URL",
    "http://django_backend:8000/api/me/",
)

# Send a valid Host header because Docker service names may contain underscores
DJANGO_REQUEST_HOST = os.getenv(
    "CHAT_DJANGO_REQUEST_HOST",
    "localhost",
)

# Stop the authentication request if Django does not respond in time
DJANGO_REQUEST_TIMEOUT_SECONDS = 5.0


# Validate the trusted user data returned by Django
class DjangoCurrentUserResponse(BaseModel):
    """Represent the trusted user fields returned by Django"""

    # Ignore unrelated profile fields and validate required fields strictly
    model_config = ConfigDict(
        extra="ignore",
        strict=True,
        str_strip_whitespace=True,
    )

    # Require a positive database user identifier
    id: int = Field(gt=0)

    # Keep the username within the backend username limit
    username: str = Field(
        min_length=1,
        max_length=USERNAME_MAX_LENGTH,
    )


# Store the trusted chat author together with the token expiration time
class AuthenticatedChatUser(BaseModel):
    """Keep the verified author and token expiry together"""

    # Reject unexpected fields and prevent changes after validation
    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        strict=True,
    )

    author: ChatAuthor
    token_expires_at: datetime

    # Calculate how long the authenticated connection may remain valid
    def seconds_until_expiry(self) -> float:
        """Return the remaining token lifetime in seconds"""

        now = datetime.now(timezone.utc)

        return (
            self.token_expires_at - now
        ).total_seconds()


# Restrict public authentication failures to known error codes
ChatAuthenticationErrorCode = Literal[
    "AUTH_INVALID",
    "AUTH_EXPIRED",
    "INTERNAL_ERROR",
]


# Pass safe authentication errors to the WebSocket layer
class ChatAuthenticationError(Exception):
    """Expose a safe authentication error to the WebSocket layer"""

    def __init__(
        self,
        code: ChatAuthenticationErrorCode,
        public_message: str,
    ) -> None:
        super().__init__(public_message)
        self.code = code
        self.public_message = public_message


# Verify the JWT and extract the trusted user identifier and expiration
def _decode_token_identity(
    access_token: str,
) -> tuple[int, datetime]:
    """Verify the JWT and return its user id and expiry"""

    try:
        # Verify the signature and require identity and expiration claims
        payload = jwt.decode(
            access_token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={
                "require": ["user_id", "exp"],
            },
        )

    # Convert an expired JWT into a safe public error
    except jwt.ExpiredSignatureError as exc:
        raise ChatAuthenticationError(
            code="AUTH_EXPIRED",
            public_message="Authentication has expired",
        ) from exc

    # Hide all other JWT validation details from the client
    except jwt.PyJWTError as exc:
        raise ChatAuthenticationError(
            code="AUTH_INVALID",
            public_message="Authentication is invalid",
        ) from exc

    # Read the required identity and expiration claims
    raw_user_id = payload.get("user_id")
    raw_expiration = payload.get("exp")

    # Reject a missing user identifier and boolean values
    if raw_user_id is None or isinstance(raw_user_id, bool):
        raise ChatAuthenticationError(
            code="AUTH_INVALID",
            public_message="Authentication is invalid",
        )

    # Reject a missing expiration and boolean values
    if raw_expiration is None or isinstance(raw_expiration, bool):
        raise ChatAuthenticationError(
            code="AUTH_INVALID",
            public_message="Authentication is invalid",
        )

    try:
        # Convert JWT claim values into application types
        user_id = int(raw_user_id)
        expiration_timestamp = float(raw_expiration)
        token_expires_at = datetime.fromtimestamp(
            expiration_timestamp,
            tz=timezone.utc,
        )

    # Reject malformed identifiers and timestamps
    except (TypeError, ValueError, OverflowError, OSError) as exc:
        raise ChatAuthenticationError(
            code="AUTH_INVALID",
            public_message="Authentication is invalid",
        ) from exc

    # Database user identifiers must be positive
    if user_id <= 0:
        raise ChatAuthenticationError(
            code="AUTH_INVALID",
            public_message="Authentication is invalid",
        )

    # Reject tokens that have already expired
    if token_expires_at <= datetime.now(timezone.utc):
        raise ChatAuthenticationError(
            code="AUTH_EXPIRED",
            public_message="Authentication has expired",
        )

    return user_id, token_expires_at


# Fetch the current trusted user identity from Django
async def _fetch_current_user(
    access_token: str,
) -> DjangoCurrentUserResponse:
    """Fetch the current id and username from Django"""

    try:
        # Use an asynchronous client so the WebSocket event loop stays responsive
        async with httpx.AsyncClient(
            timeout=DJANGO_REQUEST_TIMEOUT_SECONDS,
        ) as client:
            response = await client.get(
                DJANGO_CURRENT_USER_URL,
                headers={
                    # Forward the same access token for Django authentication
                    "Authorization": f"Bearer {access_token}",

                    # Use a Django-compatible Host header inside Docker
                    "Host": DJANGO_REQUEST_HOST,
                },
            )

    # Convert network and timeout failures into a safe internal error
    except httpx.RequestError as exc:
        raise ChatAuthenticationError(
            code="INTERNAL_ERROR",
            public_message="Authentication service is unavailable",
        ) from exc

    # Treat rejected Django authentication as invalid chat authentication
    if response.status_code in {401, 403}:
        raise ChatAuthenticationError(
            code="AUTH_INVALID",
            public_message="Authentication is invalid",
        )

    # Hide unexpected Django responses from the WebSocket client
    if response.status_code != 200:
        raise ChatAuthenticationError(
            code="INTERNAL_ERROR",
            public_message="Authentication service is unavailable",
        )

    try:
        # Decode and validate the trusted identity fields
        response_payload = response.json()

        return DjangoCurrentUserResponse.model_validate(
            response_payload,
        )

    # Reject malformed JSON and invalid Django response data
    except (ValueError, ValidationError) as exc:
        raise ChatAuthenticationError(
            code="INTERNAL_ERROR",
            public_message=(
                "Authentication service returned invalid data"
            ),
        ) from exc


# Combine local JWT verification with the current Django user
async def authenticate_chat_user(
    access_token: str,
) -> AuthenticatedChatUser:
    """Build the trusted chat identity from JWT and Django"""

    # Verify the token locally before contacting Django
    token_user_id, token_expires_at = (
        _decode_token_identity(access_token)
    )

    # Fetch the current trusted user data from Django
    current_user = await _fetch_current_user(
        access_token,
    )

    # Prevent a token from being associated with a different Django user
    if current_user.id != token_user_id:
        raise ChatAuthenticationError(
            code="AUTH_INVALID",
            public_message="Authentication is invalid",
        )

    # Reject a token that expired while Django was being contacted
    if token_expires_at <= datetime.now(timezone.utc):
        raise ChatAuthenticationError(
            code="AUTH_EXPIRED",
            public_message="Authentication has expired",
        )

    # Return only the trusted public author data and token lifetime
    return AuthenticatedChatUser(
        author=ChatAuthor(
            id=current_user.id,
            username=current_user.username,
        ),
        token_expires_at=token_expires_at,
    )