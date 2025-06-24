#!/bin/bash

echo "🔍 Поиск контейнеров PostgreSQL..."

# Находим правильное имя контейнера PostgreSQL
POSTGRES_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "(postgres|db)" | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ Контейнер PostgreSQL не найден!"
    echo "📋 Доступные контейнеры:"
    docker ps --format "table {{.Names}}\t{{.Image}}"
    exit 1
fi

echo "✅ Найден контейнер PostgreSQL: $POSTGRES_CONTAINER"

echo "🗑️ УДАЛЕНИЕ ВСЕХ ЗАКАЗОВ ИЗ БАЗЫ ДАННЫХ..."

# Выполняем SQL команды для очистки
docker exec -i "$POSTGRES_CONTAINER" psql -U apelsin_user -d apelsin_db << 'EOF'
-- Показываем что есть ПЕРЕД удалением
\echo '=== BEFORE CLEANUP ==='
SELECT 'orders' as table_name, COUNT(*) as count FROM orders;
SELECT 'order_items' as table_name, COUNT(*) as count FROM order_items;

-- Удаляем ВСЕ записи
\echo '=== DELETING DATA ==='
DELETE FROM order_items;
DELETE FROM orders;

-- Сбрасываем автоинкремент
ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS order_items_id_seq RESTART WITH 1;

-- Показываем результат ПОСЛЕ удаления
\echo '=== AFTER CLEANUP ==='
SELECT 'orders' as table_name, COUNT(*) as count FROM orders;
SELECT 'order_items' as table_name, COUNT(*) as count FROM order_items;

-- Финальная проверка - показываем все оставшиеся записи
\echo '=== FINAL CHECK ==='
SELECT * FROM orders LIMIT 10;
SELECT * FROM order_items LIMIT 10;
EOF

echo "🔄 Перезапуск приложения..."
docker-compose restart app

echo "✅ ОЧИСТКА ЗАВЕРШЕНА!"
echo "📊 Проверьте панель управления - должно показать 0 заказов"

# Простая проверка без jq
echo "🔍 Проверка API (без jq)..."
sleep 3
curl -s http://localhost:3000/api/dashboard/stats
echo ""
