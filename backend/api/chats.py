from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.database import get_db
from database import crud, models
from schemas import schemas

router = APIRouter()

def get_current_user(x_user_id: int = Header(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

@router.get("/my", response_model=schemas.ChatResponse)
def get_my_chat(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):

    if current_user.role != models.RoleEnum.user:
        raise HTTPException(status_code=400, detail="Модераторы не имеют личного чата")
    
    chat = crud.get_or_create_chat(db, user_id=current_user.id)
    return chat

@router.get("/all", response_model=List[schemas.ChatResponse])
def get_all_chats(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):

    if current_user.role != models.RoleEnum.moderator:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    return db.query(models.Chat).all()