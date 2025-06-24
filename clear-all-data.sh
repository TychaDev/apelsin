#!/bin/bash

echo "🗑️ Полная очистка всех данных..."

# Остановка контейнеров
docker-compose down

# Очистка базы данных
docker-compose up -d postgres
sleep 5

# Подключение к базе и очистка всех данных
docker exec -i apelsin-postgres psql -U apelsin_user -d apelsin_db << 'EOF'
-- Удаляем все данные из всех таблиц
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE import_logs CASCADE;

-- Сбрасываем счетчики автоинкремента
ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS import_logs_id_seq RESTART WITH 1;

-- Проверяем что все очищено
SELECT 'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'order_items' as table_name, COUNT(*) as count FROM order_items
UNION ALL
SELECT 'products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'import_logs' as table_name, COUNT(*) as count FROM import_logs;

\q
EOF

# Очистка загруженных изображений
echo "🖼️ Очистка изображений товаров..."
rm -rf public/uploads/products/*
mkdir -p public/uploads/products

# Перезапуск приложения
echo "🔄 Перезапуск приложения..."
docker-compose down
docker-compose up -d

echo "✅ Все данные полностью очищены!"
echo "📊 База данных пуста"
echo "🖼️ Изображения удалены"
echo "🚀 Приложение перезапущено"
