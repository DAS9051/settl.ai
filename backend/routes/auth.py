import os
from typing import Any, Dict

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from schemas import SetRolePayload
from services.auth import get_current_user_dep

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/set-role", status_code=200)
async def set_role(
    payload: SetRolePayload,
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
):
    """
    Set the user's role (worker or business) in Clerk publicMetadata.
    Called after sign-up when the user has chosen their role.
    """
    clerk_user_id: str = current_user.get("sub", "")
    clerk_secret = os.environ.get("CLERK_SECRET_KEY")

    if not clerk_secret:
        # Dev mode: skip Clerk API call silently
        return {"ok": True, "role": payload.role}

    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            f"https://api.clerk.com/v1/users/{clerk_user_id}",
            headers={
                "Authorization": f"Bearer {clerk_secret}",
                "Content-Type": "application/json",
            },
            json={"public_metadata": {"role": payload.role}},
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to set role in Clerk: {resp.text}",
            )

    return {"ok": True, "role": payload.role}
