"""Создание тестовых заказов через API (JWT). Запуск: python seed.py (backend на :8000)."""
import requests

BASE = "http://localhost:8000/api"

FAKE_ORDERS = [
    {"origin": "Москва", "destination": "Санкт-Петербург", "weight": 1.2},
    {"origin": "Казань", "destination": "Екатеринбург", "weight": 5.0},
    {"origin": "Новосибирск", "destination": "Владивосток", "weight": 12.5},
    {"origin": "Ростов-на-Дону", "destination": "Сочи", "weight": 0.8},
    {"origin": "Волгоград", "destination": "Самара", "weight": 3.3},
]


def main() -> None:
    r = requests.post(
        f"{BASE}/auth/login",
        json={"username": "user", "password": "user"},
        timeout=10,
    )
    r.raise_for_status()
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("Генерация тестовых заказов...")
    for order in FAKE_ORDERS:
        resp = requests.post(f"{BASE}/orders", json=order, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            print(f"OK {data.get('tracking_number', '?')}")
        else:
            print(f"ERR: {resp.status_code} {resp.text}")
    print("Готово.")


if __name__ == "__main__":
    main()
