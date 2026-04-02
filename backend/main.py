from fastapi import FastAPI
from api import auth, orders, chats
from database.database import engine, Base, SessionLocal
from database import models, crud
from schemas import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Logistic AI Project API",
    description="API для логистической компании",
    version="1.0.0"
)

def init_db():
    db = SessionLocal()
    try:
        if not crud.get_user_by_username(db, "admin"):
            crud.create_user(db, schemas.UserCreate(username="admin", password="password"), role=models.RoleEnum.moderator)
            test_user = crud.create_user(db, schemas.UserCreate(username="client", password="password"), role=models.RoleEnum.user)
            crud.create_order(db, schemas.OrderCreate(
                tracking_number="TRACK-777", origin="Москва", destination="Казань", weight=2.5
            ), user_id=test_user.id)
            print("Базовые данные успешно созданы!")
    finally:
        db.close()

init_db()

@app.get("/")
async def root():
    return {"message": "Бэкенд запущен. Документация: http://localhost:8000/docs"}


app.include_router(auth.router, prefix="/api/auth", tags=["Авторизация"])
app.include_router(orders.router, prefix="/api/orders", tags=["Заказы"])
app.include_router(chats.router, prefix="/api/chats", tags=["Чаты"])