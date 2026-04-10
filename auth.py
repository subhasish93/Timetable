import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from db import SessionLocal
from models import User


SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-in-production")

ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="auto"
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    })

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    if token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is deactivated")

    return user


def get_current_admin(user: User = Depends(get_current_user)):
    role_value = user.role.value if hasattr(user.role, 'value') else user.role
    if role_value not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def get_current_faculty(user: User = Depends(get_current_user)):
    role_value = user.role.value if hasattr(user.role, 'value') else user.role
    if role_value not in ["faculty", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Faculty access required")
    return user


def get_current_super_admin(user: User = Depends(get_current_user)):
    role_value = user.role.value if hasattr(user.role, 'value') else user.role
    if role_value != "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return user
