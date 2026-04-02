from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.database import get_db
from database import crud, models
from schemas import schemas

router = APIRouter()

def get_current_user(x_user_id: int = Header(..., description="ID пользователя из LocalStorage"), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

@router.get("/", response_model=List[schemas.OrderResponse])
def get_orders(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):

    if current_user.role == models.RoleEnum.moderator:
        return crud.get_all_orders(db)
    return crud.get_orders_by_user(db, user_id=current_user.id)