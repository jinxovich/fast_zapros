from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database.database import Base

# Перечисления для строгих статусов 
class RoleEnum(str, enum.Enum):
    user = "user"
    moderator = "moderator"

class OrderStatusEnum(str, enum.Enum):
    created = "created"
    in_transit = "in_transit"
    arrived = "arrived"
    delivered = "delivered"

class SenderRoleEnum(str, enum.Enum):
    user = "user"
    bot = "bot"
    moderator = "moderator"

# Модели таблиц 

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.user)

    # Связи с другими таблицами
    orders = relationship("Order", back_populates="owner")
    chats = relationship("Chat", back_populates="user")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(SQLEnum(OrderStatusEnum), default=OrderStatusEnum.created)
    origin = Column(String)
    destination = Column(String)
    weight = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="orders")

class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    is_bot_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"))
    sender_role = Column(SQLEnum(SenderRoleEnum), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    chat = relationship("Chat", back_populates="messages")