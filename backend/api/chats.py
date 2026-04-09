from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.database import get_db
from database import crud, models
from schemas import schemas
from agent.core import generate_ai_response
from security import get_current_user, require_role

router = APIRouter()

def _is_client_like(role: str) -> bool:
    return role in (
        models.RoleEnum.user.value,
        models.RoleEnum.pending_moderator.value,
        models.RoleEnum.pending_admin.value,
    )


@router.get("/my", response_model=schemas.ChatResponse)
def get_my_chat(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _is_client_like(current_user.role):
        raise HTTPException(status_code=400, detail="Модераторы не имеют личного чата")
    
    chat = crud.get_or_create_chat(db, user_id=current_user.id)
    return chat

@router.get("/all", response_model=List[schemas.ChatResponse])
def get_all_chats(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [models.RoleEnum.moderator.value, models.RoleEnum.admin.value]:
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    
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

@router.post("/message", response_model=schemas.MessageResponse)
def send_message(
    request: schemas.MessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not _is_client_like(current_user.role):
        raise HTTPException(status_code=400, detail="Только клиенты могут общаться с ботом")

    chat = crud.get_or_create_chat(db, user_id=current_user.id)

    crud.add_message_to_chat(db, chat_id=chat.id, sender_role=models.SenderRoleEnum.user, content=request.content)

    if chat.is_bot_active:
        ai_text = generate_ai_response(
            db=db,
            chat_id=chat.id,
            user_id=current_user.id,
            user_message=request.content,
        )
        ai_msg = crud.add_message_to_chat(db, chat_id=chat.id, sender_role=models.SenderRoleEnum.bot, content=ai_text)
        return ai_msg
    return crud.add_message_to_chat(db, chat_id=chat.id, sender_role=models.SenderRoleEnum.bot, content="Бот отключён. Ожидайте ответ модератора.")

@router.post("/{chat_id}/moderator-message", response_model=schemas.MessageResponse)
def moderator_message(
    chat_id: int,
    request: schemas.MessageCreate,
    _: models.User = Depends(require_role(models.RoleEnum.moderator.value, models.RoleEnum.admin.value)),
    db: Session = Depends(get_db),
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Чат не найден")
    return crud.add_message_to_chat(db, chat_id=chat.id, sender_role=models.SenderRoleEnum.moderator, content=request.content)

@router.post("/{chat_id}/bot-toggle", response_model=schemas.ChatResponse)
def toggle_bot(
    chat_id: int,
    is_bot_active: bool,
    _: models.User = Depends(require_role(models.RoleEnum.moderator.value, models.RoleEnum.admin.value)),
    db: Session = Depends(get_db),
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Чат не найден")
    chat.is_bot_active = bool(is_bot_active)
    db.commit()
    db.refresh(chat)
    return chat