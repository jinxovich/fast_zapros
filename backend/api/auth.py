from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.database import get_db
from database import crud, models
from schemas import schemas
from security import (
    create_access_token,
    get_current_user,
    hash_password,
    require_role,
    verify_password_with_legacy,
)

router = APIRouter()

@router.post("/login", response_model=schemas.TokenResponse)
def login(user_credentials: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user_credentials.username)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный логин или пароль")

    ok, needs_rehash = verify_password_with_legacy(
        user_credentials.password, db_user.password_hash
    )
    if not ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный логин или пароль")

    if needs_rehash:
        db_user.password_hash = hash_password(user_credentials.password)
        db.commit()
        db.refresh(db_user)

    token = create_access_token(user_id=db_user.id, role=db_user.role)
    return schemas.TokenResponse(access_token=token, user=db_user)

@router.post("/register", response_model=schemas.UserResponse)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_username(db, user_data.username):
        raise HTTPException(status_code=400, detail="Пользователь уже существует")

    user_data.password = hash_password(user_data.password)
    return crud.create_user(db, user_data, role=models.RoleEnum.user.value)


@router.get("/me", response_model=schemas.UserResponse)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.post("/request-role", response_model=schemas.UserResponse)
def request_role(
    payload: schemas.RoleRequestCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Нельзя напрямую создать модера/админа: только заявка -> pending_*
    if payload.role == models.RoleEnum.moderator:
        requested = models.RoleEnum.pending_moderator.value
    elif payload.role == models.RoleEnum.admin:
        requested = models.RoleEnum.pending_admin.value
    else:
        raise HTTPException(status_code=400, detail="Заявка доступна только на роли admin/moderator")

    if current_user.role in [models.RoleEnum.admin.value, models.RoleEnum.moderator.value]:
        raise HTTPException(status_code=400, detail="Роль уже повышена, заявка не требуется")

    updated = crud.request_role_upgrade(db, current_user.id, requested=requested)
    if not updated:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return updated


@router.get("/requests", response_model=List[schemas.UserResponse])
def list_requests(
    _: models.User = Depends(require_role(models.RoleEnum.admin.value)),
    db: Session = Depends(get_db),
):
    return crud.list_pending_users(db)

@router.post("/approve/{user_id}", response_model=schemas.UserResponse)
def approve_request(
    user_id: int,
    _: models.User = Depends(require_role(models.RoleEnum.admin.value)),
    db: Session = Depends(get_db),
):
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.role == models.RoleEnum.pending_moderator.value:
        new_role = models.RoleEnum.moderator.value
    elif user.role == models.RoleEnum.pending_admin.value:
        new_role = models.RoleEnum.admin.value
    else:
        raise HTTPException(status_code=400, detail="У пользователя нет активной заявки")

    updated = crud.update_user_role(db, user_id, new_role)
    return updated