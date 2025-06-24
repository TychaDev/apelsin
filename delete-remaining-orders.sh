#!/bin/bash

echo "🗑️ УДАЛЕНИЕ ОСТАВШИХСЯ ЗАКАЗОВ..."

# Подключение к базе данных и принудительное удаление всех заказов
echo "💥 Принудительное удаление всех заказов из базы данных..."

docker exec -i apelsin-postgres psql -U apelsin_user -d apelsin_db << 'EOF'
-- Показываем что есть в базе ПЕРЕД удалением
SELECT 'BEFORE DELETE - orders' as info, COUNT(*) as count FROM orders;
SELECT 'BEFORE DELETE - order_items' as info, COUNT(*) as count FROM order_items;

-- Удаляем ВСЕ записи из order_items (связанные записи)
DELETE FROM order_items;

-- Удаляем ВСЕ записи из orders
DELETE FROM orders;

-- Сбрасываем автоинкремент для orders
ALTER SEQUENCE orders_id_seq RESTART WITH 1;

-- Сбрасываем автоинкремент для order_items
ALTER SEQUENCE order_items_id_seq RESTART WITH 1;

-- Показываем что есть в базе ПОСЛЕ удаления
SELECT 'AFTER DELETE - orders' as info, COUNT(*) as count FROM orders;
SELECT 'AFTER DELETE - order_items' as info, COUNT(*) as count FROM order_items;

-- Проверяем что таблицы действительно пусты
SELECT 'Final check - orders' as table_name, id, customer_phone, total, status FROM orders LIMIT 10;
SELECT 'Final check - order_items' as table_name, id, order_id, product_name FROM order_items LIMIT 10;
EOF

echo "🔄 Перезапуск приложения для обновления кэша..."
docker-compose restart app

echo "✅ УДАЛЕНИЕ ЗАВЕРШЕНО!"
echo "📊 Все заказы должны быть удалены"
echo "🔄 Приложение перезапущено"

# Проверяем результат через API
echo "🔍 Проверка через API..."
sleep 5
curl -s http://localhost:3000/api/dashboard/stats | jq '.' || echo "API недоступен"
