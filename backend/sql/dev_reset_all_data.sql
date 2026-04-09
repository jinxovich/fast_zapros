-- Полный сброс данных приложения (PostgreSQL).
-- Удаляет пользователей, заказы, чаты и сообщения. Используйте только на dev.
-- После перезапуска backend init_db() создаст заново admin/user и тестовый заказ.

TRUNCATE TABLE messages RESTART IDENTITY CASCADE;
TRUNCATE TABLE chats RESTART IDENTITY CASCADE;
TRUNCATE TABLE orders RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
