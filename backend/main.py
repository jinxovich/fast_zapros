from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, orders, chats
from database.database import engine, Base, SessionLocal
from database import models, crud
from schemas import schemas
from security import hash_password

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Logistic AI Project API",
    description="API для логистической компании",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    db = SessionLocal()
    try:
        if not crud.get_user_by_username(db, "admin"):
            admin = schemas.UserCreate(username="admin", password=hash_password("root"))
            crud.create_user(
                db, 
                admin,
                role=models.RoleEnum.admin.value
            )
            
            test_user = crud.create_user(
                db, 
                schemas.UserCreate(username="user", password=hash_password("user")),
                role=models.RoleEnum.user.value
            )
            
            crud.create_order(
                db, 
                schemas.OrderCreate(tracking_number="TRACK-777", origin="Москва", destination="Казань", weight=2.5),
                user_id=test_user.id
            )
            
            print("✅ Базовые пользователи успешно созданы (admin:root, user:user)!")
    finally:
        db.close()

init_db()

@app.get("/")
async def root():
    return {"message": "Бэкенд запущен. Документация: http://localhost:8000/docs"}


app.include_router(auth.router, prefix="/api/auth", tags=["Авторизация"])
app.include_router(orders.router, prefix="/api/orders", tags=["Заказы"])
app.include_router(chats.router, prefix="/api/chats", tags=["Чаты"])