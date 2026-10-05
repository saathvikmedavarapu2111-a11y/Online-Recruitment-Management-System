"""Admin: user management."""
from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..security import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users")
def list_users(user: dict = Depends(require_admin)):
    return db.fetch_all(
        """SELECT user_id, name, email, role, created_at FROM users
           ORDER BY created_at DESC"""
    )


@router.delete("/users/{user_id}")
def delete_user(user_id: int, user: dict = Depends(require_admin)):
    if user_id == user["user_id"]:
        raise HTTPException(
            status_code=400, detail="You cannot delete your own admin account"
        )
    deleted = db.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}
