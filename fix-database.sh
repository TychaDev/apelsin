#!/bin/bash

echo "=== Исправление базы данных ==="

# Остановка контейнеров
echo "1. Остановка контейнеров..."
docker-compose down

# Удаление старых данных
echo "2. Очистка старых данных..."
docker volume rm apelsin_postgres_data 2>/dev/null || true

# Удаление старого скрипта инициализации
rm -f scripts/init-database.sql scripts/create-test-user.sql

echo "3. Пересборка и запуск..."
docker-compose up -d --build

echo "4. Ожидание инициализации базы данных (60 секунд)..."
sleep 60

echo "5. Проверка таблиц..."
docker-compose exec db psql -U apelsin_user -d apelsin_db -c "\dt"

echo "6. Проверка пользователей..."
docker-compose exec db psql -U apelsin_user -d apelsin_db -c "SELECT id, name, email, role FROM users;"

echo "7. Проверка товаров..."
docker-compose exec db psql -U apelsin_user -d apelsin_db -c "SELECT COUNT(*) as product_count FROM products;"

echo "8. Проверка заказов..."
docker-compose exec db psql -U apelsin_user -d apelsin_db -c "SELECT COUNT(*) as order_count FROM orders;"

echo "=== База данных готова! ==="
echo "Данные для входа:"
echo "Email: manager@apelsin.kz"
echo "Пароль: manager123"
echo ""
echo "Админ панель:"
echo "Email: admin@apelsin.kz"
echo "Пароль: 8174126811dda"
