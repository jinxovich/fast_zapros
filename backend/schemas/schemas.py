from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from database.models import RoleEnum, OrderStatusEnum, SenderRoleEnum

# Схемы Пользователя
class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: RoleEnum
    
    model_config = ConfigDict(from_attributes=True)

# Схемы Заказов
class OrderCreate(BaseModel):
    tracking_number: str
    origin: str
    destination: str
    weight: float

class OrderResponse(BaseModel):
    id: int
    tracking_number: str
    user_id: int
    status: OrderStatusEnum
    origin: str
    destination: str
    weight: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Схемы Чатов и Сообщений
class MessageCreate(BaseModel):
    sender_role: SenderRoleEnum
    content: str

class MessageResponse(BaseModel):
    id: int
    chat_id: int
    sender_role: SenderRoleEnum
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatResponse(BaseModel):
    id: int
    user_id: int
    is_bot_active: bool
    messages: List[MessageResponse] =[]

    model_config = ConfigDict(from_attributes=True)