from fastapi import APIRouter, HTTPException

from app.schemas.user_schema import UserCreate, UserRead
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])
service = UserService()

@router.post("/", response_model=UserRead)
def create_user(user_in: UserCreate):
    try:
        return service.create_user(user_in)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
