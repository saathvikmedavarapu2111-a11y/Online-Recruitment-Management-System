"""Authentication: register, login, who-am-I."""
from fastapi import APIRouter, Depends, HTTPException, status

from .. import db
from ..schemas import LoginIn, RegisterIn
from ..security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _public_user(row: dict) -> dict:
    return {
        "user_id": row["user_id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterIn):
    if db.fetch_one("SELECT user_id FROM users WHERE email = %s", (data.email,)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )
    row = db.execute_returning(
        """INSERT INTO users (name, email, password_hash, role)
           VALUES (%s, %s, %s, %s)
           RETURNING user_id, name, email, role""",
        (data.name.strip(), data.email.lower(), hash_password(data.password), data.role),
    )
    if data.role == "applicant":
        # Every applicant gets an (initially empty) candidate profile.
        db.execute("INSERT INTO candidates (user_id) VALUES (%s)", (row["user_id"],))
    token = create_access_token(row["user_id"], row["role"])
    return {"access_token": token, "token_type": "bearer", "user": _public_user(row)}


@router.post("/login")
def login(data: LoginIn):
    user = db.fetch_one("SELECT * FROM users WHERE email = %s", (data.email.lower(),))
    if user is None or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(user["user_id"], user["role"])
    return {"access_token": token, "token_type": "bearer", "user": _public_user(user)}


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return _public_user(user)
