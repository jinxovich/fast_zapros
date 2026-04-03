from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.database import get_db
from database import crud, models
from schemas import schemas
from agent.core import generate_ai_response

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

@router.delete("/{chat_id}/clear")
def clear_chat(
    chat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chat = db.query(models.Chat).filter(
        models.Chat.id == chat_id,
        models.Chat.user_id == current_user.id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Чат не найден или доступ запрещён")
        
    db.query(models.Message).filter(models.Message.chat_id == chat_id).delete()
    db.commit()
    
    return {"status": "cleared", "chat_id": chat_id}




from pydantic import BaseModel

class SendMessageRequest(BaseModel):
    content: str

@router.post("/message", response_model=schemas.MessageResponse)
def send_message(
    request: SendMessageRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.RoleEnum.user:
        raise HTTPException(status_code=400, detail="Только клиенты могут общаться с ботом")

    chat = crud.get_or_create_chat(db, user_id=current_user.id)

    crud.add_message_to_chat(db, chat_id=chat.id, sender_role=models.SenderRoleEnum.user, content=request.content)

    ai_text = generate_ai_response(
        db=db, 
        chat_id=chat.id, 
        user_id=current_user.id, 
        user_message=request.content
    )

    ai_msg = crud.add_message_to_chat(db, chat_id=chat.id, sender_role=models.SenderRoleEnum.bot, content=ai_text)

    return ai_msg