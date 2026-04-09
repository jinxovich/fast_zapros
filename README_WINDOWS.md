**Backend:**
- FastAPI (Python 3.11+)
- PostgreSQL (Docker)
- JWT аутентификация
- Роли: `user` / `moderator` / `admin` / `pending_moderator` / `pending_admin`
- REST API
- SQLAlchemy ORM
- Alembic миграции

**Frontend:**
- React 19 + TypeScript
- Vite 8
- React Router v7
- Axios
- Lucide React иконки
- Современный тёмный UI с анимациями
- Интерактивная визуализация архитектуры

**AI (опционально):**
- Ollama (Mistral/Llama)
- RAG (ChromaDB)
- Function Calling
- 8 инструментов (расчёт стоимости, статусы, даты и т.д.)

---


---

### 1. Установка базы данных (PostgreSQL + Adminer)

Откройте **PowerShell** или **Command Prompt**:

```powershell
# Перейдите в корень проекта
cd path\to\fast_zapros

# Запустите PostgreSQL и Adminer
docker compose up -d db adminer
```

**Adminer** (веб-интерфейс БД): http://localhost:8080
- **Server:** `db`
- **Username:** `admin`
- **Password:** `root`
- **Database:** `logistics`

---

### 2. Настройка Backend

#### 2.1. Создайте виртуальное окружение

```powershell
cd backend

# Создайте venv
python -m venv .venv

# Активируйте
.\.venv\Scripts\activate
```

#### 2.2. Установите зависимости

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

#### 2.3. Настройте переменные окружения

Создайте файл `.env` в папке `backend/`:

```env
# Database
DATABASE_URL=postgresql://admin:root@localhost:5432/logistics

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-production

# Ollama (опционально, можно закомментировать)
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL_NAME=mistral

# App
ENV=development
```

#### 2.4. Запустите backend

```powershell
# Убедитесь, что находитесь в backend/ и venv активен
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**API документация (Swagger):** http://localhost:8000/docs

---

### 3. Настройка Frontend

#### 3.1. Установите зависимости

Откройте **новый терминал** (не закрывая backend):

```powershell
cd frontend

npm install
```

#### 3.2. Запустите frontend

```powershell
npm run dev
```

Откройте в браузере: **http://localhost:5173**

---

## 🔐 Тестовые пользователи

После первого запуска backend создаются автоматически:

| Логин | Пароль | Роль | Описание |
|-------|--------|------|----------|
| `admin` | `root` | admin | Полный доступ |
| `user` | `user` | user | Клиент |

---

## 📁 Структура проекта

```
fast_zapros/
├── backend/
│   ├── api/              # API endpoints (auth, orders, chats)
│   ├── agent/            # AI агент (core, tools, RAG)
│   ├── database/         # Models, CRUD, connection
│   ├── schemas/          # Pydantic schemas
│   ├── security.py       # JWT, passwords
│   ├── config.py         # Config loader
│   └── main.py           # FastAPI app
│
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios client
│   │   ├── components/   # React components
│   │   ├── context/      # Auth context
│   │   ├── pages/        # Pages (Orders, Chat, Architecture)
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx       # Main app + routing
│   └── vite.config.ts    # Vite config with /api proxy
│
└── docker-compose.yml    # PostgreSQL + Adminer
```

---

## 🌐 API Endpoints

### Auth
- `POST /api/auth/register` — Регистрация
- `POST /api/auth/login` — Вход (JWT token)
- `GET /api/auth/me` — Текущий пользователь
- `POST /api/auth/request-role` — Заявка на роль
- `GET /api/auth/requests` — Список заявок (admin)
- `POST /api/auth/approve/{id}` — Одобрить заявку (admin)

### Orders
- `POST /api/orders` — Создать заказ
- `GET /api/orders/my` — Мои заказы
- `GET /api/orders/all` — Все заказы (moderator/admin)
- `GET /api/orders/{tracking}` — Поиск по трек-номеру

### Chats
- `GET /api/chats/my` — Личный чат с ИИ
- `POST /api/chats/message` — Отправить сообщение
- `GET /api/chats/all` — Все чаты (moderator/admin)
- `POST /api/chats/{id}/moderator-message` — Ответ модератора
- `POST /api/chats/{id}/bot-toggle` — Вкл/выкл бота
- `DELETE /api/chats/{id}/clear` — Очистить историю

---

## 🎨 Возможности

### Для клиентов (`user`)
- ✅ Создание заказов с трек-номером
- ✅ Просмотр своих заказов
- ✅ Чат с ИИ-ассистентом (расчёт стоимости, сроки, правила)
- ✅ Заявка на повышение роли (moderator/admin)

### Для модераторов
- ✅ Просмотр всех заказов
- ✅ Управление чатами пользователей
- ✅ Ручные ответы в чат
- ✅ Вкл/выкл ИИ-бота

### Для админов
- ✅ Всё выше + одобрение заявок на роли

### Интерактивная архитектура
- `/architecture` — Карточки с описанием компонентов
- `/architecture-diagram` — Интерактивная схема с анимацией (pan/zoom)

---

## 🛠️ Разработка

### Backend

```powershell
cd backend
.\.venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```powershell
cd frontend
npm run dev
```

### База данных

```powershell
# Просмотр логов
docker logs logistic_pg

# Остановить
docker compose stop db adminer

# Удалить (данные потеряются!)
docker compose down -v
```

---

### Frontend

```powershell
cd frontend
npm run build
# Результат в frontend/dist/
```

### Backend

```powershell
cd backend
# Установите production зависимости
pip install -r requirements.txt

# Запустите без auto-reload
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

- **Пароли** хешируются через bcrypt
- **JWT токены** хранятся в localStorage
- **CORS** настроен для localhost:5173
- **Прокси** `/api/*` → `http://localhost:8000/api/*`

