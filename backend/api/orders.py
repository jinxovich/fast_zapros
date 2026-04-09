import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.database import get_db
from database import crud, models
from schemas import schemas
from security import get_current_user, require_role

router = APIRouter()

def _is_client_like(role: str) -> bool:
    return role in (
        models.RoleEnum.user.value,
        models.RoleEnum.pending_moderator.value,
        models.RoleEnum.pending_admin.value,
    )


@router.post("", response_model=schemas.OrderResponse)
def create_order(
    payload: schemas.OrderCreateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _is_client_like(current_user.role):
        raise HTTPException(status_code=403, detail="Только клиенты могут создавать заказы")

    tracking_number = f"TRK-{secrets.token_hex(4).upper()}"
    order_in = schemas.OrderCreate(
        tracking_number=tracking_number,
        origin=payload.origin,
        destination=payload.destination,
        weight=payload.weight,
    )
    created = crud.create_order(db, order_in, user_id=current_user.id)
    return created


@router.get("/my", response_model=List[schemas.OrderResponse])
def my_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_orders_by_user(db, current_user.id)


@router.get("/all", response_model=List[schemas.OrderResponse])
def all_orders(
    _: models.User = Depends(require_role(models.RoleEnum.moderator.value, models.RoleEnum.admin.value)),
    db: Session = Depends(get_db),
):
    return crud.get_all_orders(db)


@router.get("/{tracking_number}", response_model=schemas.OrderResponse)
def order_by_tracking(
    tracking_number: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = crud.get_order_by_tracking(db, tracking_number)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    if _is_client_like(current_user.role) and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет прав на просмотр")

    return order