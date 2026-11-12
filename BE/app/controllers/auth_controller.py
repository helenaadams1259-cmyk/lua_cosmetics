from fastapi import APIRouter, HTTPException

from app.schemas.auth_schema import Token, UserLogin
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
service = AuthService()

@router.post("/login", response_model=Token)
def login(login_data: UserLogin):
    user = service.authenticate_user(login_data)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = service.create_access_token(
        data={"sub": user["username"], "is_admin": user["is_admin"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}
