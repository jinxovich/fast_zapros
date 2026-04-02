from sqlalchemy.orm import Session
from database import models
from schemas import schemas

# Пользователи
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate, role: models.RoleEnum = models.RoleEnum.user):
    db_user = models.User(username=user.username, password_hash=user.password, role=role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Заказы
def create_order(db: Session, order: schemas.OrderCreate, user_id: int):
    db_order = models.Order(**order.model_dump(), user_id=user_id)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

def get_orders_by_user(db: Session, user_id: int):
    return db.query(models.Order).filter(models.Order.user_id == user_id).all()

def get_all_orders(db: Session): # Для модератора
    return db.query(models.Order).all()

def get_order_by_tracking(db: Session, tracking_number: str):
    return db.query(models.Order).filter(models.Order.tracking_number == tracking_number).first()

# Чаты и Сообщения
def get_or_create_chat(db: Session, user_id: int):
    chat = db.query(models.Chat).filter(models.Chat.user_id == user_id).first()
    if not chat:
        chat = models.Chat(user_id=user_id)
        db.add(chat)
        db.commit()
        db.refresh(chat)
    return chat

def add_message_to_chat(db: Session, chat_id: int, sender_role: models.SenderRoleEnum, content: str):
    message = models.Message(chat_id=chat_id, sender_role=sender_role, content=content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message