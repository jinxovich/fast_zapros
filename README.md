# fast_zapros — логистика + ИИ-чат (MVP)

## Что внутри

- **Backend**: FastAPI, PostgreSQL, JWT, роли `user` / `moderator` / `admin`, заявки на повышение роли, заказы, чат с RAG+tools (Ollama).
- **Frontend**: React + Vite, прокси `/api` → backend.

## Быстрый старт (локально)

### 1. База данных

```bash
cp .env.example .env
# При необходимости поправьте POSTGRES_* и DATABASE_URL для localhost:
# DATABASE_URL=postgresql://admin:root@localhost:5432/logistics

docker compose up -d db adminer
```

Adminer: [http://localhost:8080](http://localhost:8080) (сервер `db`, БД/логин/пароль из `.env`).

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://admin:root@localhost:5432/logistics
export JWT_SECRET_KEY=dev-secret-change-me
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Документация API: [http://localhost:8000/docs](http://localhost:8000/docs).

При первом запуске создаются тестовые пользователи (см. `backend/main.py`):

| Логин   | Пароль | Роль   |
|---------|--------|--------|
| `admin` | `root` | admin  |
| `user`  | `user` | user   |

Дополнительно создаётся пример заказа `TRACK-777` у `user`.

### 3. Ollama (для ответов ИИ в чате)

По умолчанию backend ждёт Ollama на `http://localhost:11434` и модель из `OLLAMA_MODEL_NAME` (см. `.env.example`). Если Ollama не запущена, чат вернёт сообщение о недоступности сервиса.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте URL из вывода Vite (обычно [http://localhost:5173](http://localhost:5173)). Запросы к `/api` проксируются на `http://localhost:8000` (см. `frontend/vite.config.ts`).

## Docker: только Postgres + опционально backend

```bash
docker compose up -d
```

В `docker-compose.yml` сервис `backend` (если включён) использует `DATABASE_URL` с хостом `db`. Сборка образа: контекст каталога `backend/` (`backend/Dockerfile`).

## Тестовые заказы (скрипт)

Нужны `requests` и запущенный backend:

```bash
pip install requests
python seed.py
```


## Пароли после перехода на bcrypt

Если в БД остались **старые plain-text** значения в `users.password_hash`, при логине возможна ошибка `UnknownHashError`. Сделано так:

1. **При успешном входе** старый формат распознаётся, пароль проверяется по plain-сравнению и **сразу перезаписывается в bcrypt** ([`backend/api/auth.py`](backend/api/auth.py), [`backend/security.py`](backend/security.py)).

2. **Одноразово для всех пользователей** (из каталога `backend`):

   ```bash
   python migrate_legacy_passwords.py
   ```

3. **Полный сброс данных на dev** (PostgreSQL) — см. [`backend/sql/dev_reset_all_data.sql`](backend/sql/dev_reset_all_data.sql), затем перезапустите backend (сид создаст пользователей заново).

## Структура API (кратко)

- `POST /api/auth/register`, `POST /api/auth/login` (Bearer-токен)
- `GET /api/auth/me`, `POST /api/auth/request-role`, `GET /api/auth/requests`, `POST /api/auth/approve/{id}` (admin)
- `POST /api/orders`, `GET /api/orders/my`, `GET /api/orders/all`, `GET /api/orders/{tracking}`
- `GET /api/chats/my`, `POST /api/chats/message`, `GET /api/chats/all`, модераторские эндпоинты в `chats`
