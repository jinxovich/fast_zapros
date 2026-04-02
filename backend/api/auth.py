from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.database import get_db
from database import crud
from schemas import schemas

router = APIRouter()

@router.post("/login", response_model=schemas.UserResponse)
def login(user_credentials: schemas.UserCreate, db: Session = Depends(get_db)):
    """Вход пользователя в систему"""
    db_user = crud.get_user_by_username(db, username=user_credentials.username)
    
    if not db_user or db_user.password_hash != user_credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Неверный логин или пароль"
        )
        
    return db_user