import os
from typing import Dict, Any, Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError

CLERK_SECRET_KEY: Optional[str] = os.environ.get("CLERK_SECRET_KEY")
_clerk_domain = "saving-gull-89.clerk.accounts.dev"
CLERK_JWKS_URL = f"https://{_clerk_domain}/.well-known/jwks.json"

_jwks_cache: Optional[Dict] = None

bearer_scheme = HTTPBearer(auto_error=False)


def _fetch_jwks() -> Dict:
    """Fetch Clerk's JWKS (JSON Web Key Set) and cache it in memory."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    try:
        resp = httpx.get(CLERK_JWKS_URL, timeout=10)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        return _jwks_cache
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not fetch Clerk JWKS: {exc}",
        )


def _decode_unverified(token: str) -> Dict[str, Any]:
    """Decode a JWT without verifying the signature — used for local dev fallback."""
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token format: {exc}",
        )


def get_current_user(token: str) -> Dict[str, Any]:
    """
    Decode and verify a Clerk JWT.

    If CLERK_SECRET_KEY is not set (local dev), the token is accepted without
    signature verification so developers can work without a real Clerk project.
    Returns a dict containing at least ``sub`` (the Clerk user ID).
    """
    if not CLERK_SECRET_KEY:
        # Lenient local-dev path: accept any well-formed Bearer token.
        payload = _decode_unverified(token)
        return payload

    # Production path: verify against Clerk's JWKS.
    try:
        jwks = _fetch_jwks()
        # python-jose can pick the right key from a JWKS dict automatically.
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {exc}",
        )


async def get_current_user_dep(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Dict[str, Any]:
    """
    FastAPI dependency.  Extracts the Bearer token from the Authorization header
    and returns the verified JWT payload.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or malformed",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return get_current_user(credentials.credentials)
