#!/usr/bin/env python3
"""
Одноразовая миграция: в колонке users.password_hash раньше мог храниться plain text.
Все такие значения пересчитываются в bcrypt (как при логине).

Запуск из каталога backend (где лежит main.py):

    cd backend
    python migrate_legacy_passwords.py

Нужен тот же DATABASE_URL, что и у приложения (env или .env через config).
"""
from __future__ import annotations

from database.database import SessionLocal
from database import models
from security import hash_password


def _looks_like_bcrypt(stored: str) -> bool:
    if not stored or not isinstance(stored, str):
        return False
    return stored.startswith("$2a$") or stored.startswith("$2b$") or stored.startswith("$2y$")


def main() -> None:
    db = SessionLocal()
    updated = 0
    try:
        users = db.query(models.User).all()
        for u in users:
            if _looks_like_bcrypt(u.password_hash):
                continue
            # В legacy в колонке лежит открытый пароль — хешируем его в bcrypt
            plain = u.password_hash
            u.password_hash = hash_password(plain)
            updated += 1
        if updated:
            db.commit()
        print(f"Готово. Обновлено записей: {updated} (остальные уже были в формате bcrypt).")
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    main()
