#!/bin/bash

echo "=== Проверка базы данных ==="

# Проверка подключения к PostgreSQL
echo "1. Проверка подключения к PostgreSQL..."
docker-compose exec db psql -U apelsin_user -d apelsin_db -c "SELECT version();"

echo ""
echo "2. Проверка таблиц..."
docker-compose exec db psql -U apelsin_user -d apelsin_db -c "\dt"

echo ""
echo "3. Проверка пользователей..."
docker-compose exec db psql -U apelsin_user -d apelsin_db -c "SELECT id, name, email, role FROM users;"

echo ""
echo "4. Создание тестового пользователя..."
docker-compose exec db psql -U apelsin_user -d apelsin_db -f /docker-entrypoint-initdb.d/create-test-user.sql

echo ""
echo "5. Проверка логов приложения..."
docker-compose logs app --tail=50

echo ""
echo "6. Проверка переменных окружения..."
docker-compose exec app env | grep -E "(DATABASE_URL|JWT_SECRET)"
