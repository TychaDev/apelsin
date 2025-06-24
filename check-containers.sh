#!/bin/bash

echo "📋 СПИСОК ВСЕХ КОНТЕЙНЕРОВ:"
echo "=========================="
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

echo ""
echo "🔍 ПОИСК КОНТЕЙНЕРА БАЗЫ ДАННЫХ:"
echo "================================"
POSTGRES_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "(postgres|db)")
if [ -n "$POSTGRES_CONTAINER" ]; then
    echo "✅ Найден: $POSTGRES_CONTAINER"
else
    echo "❌ Контейнер PostgreSQL не найден"
fi

echo ""
echo "🔍 ПРОВЕРКА БАЗЫ ДАННЫХ:"
echo "========================"
if [ -n "$POSTGRES_CONTAINER" ]; then
    docker exec -i "$POSTGRES_CONTAINER" psql -U apelsin_user -d apelsin_db -c "SELECT 'orders' as table_name, COUNT(*) as count FROM orders; SELECT 'order_items' as table_name, COUNT(*) as count FROM order_items;"
else
    echo "❌ Невозможно проверить базу данных - контейнер не найден"
fi
