#!/bin/bash

echo "🗑️ ПРИНУДИТЕЛЬНАЯ ОЧИСТКА ВСЕХ ДАННЫХ..."

# Остановка всех контейнеров
docker-compose down

# Удаление volumes (это удалит все данные PostgreSQL)
echo "💥 Удаление всех данных PostgreSQL..."
docker volume rm apelsin_postgres_data 2>/dev/null || true

# Пересоздание контейнеров
echo "🔄 Пересоздание базы данных..."
docker-compose up -d postgres
sleep 10

# Инициализация базы данных заново
echo "🏗️ Инициализация новой базы данных..."
docker exec -i apelsin-postgres psql -U apelsin_user -d apelsin_db < scripts/01-init-database.sql

# Проверка что база пуста
echo "✅ Проверка очистки базы данных..."
docker exec -i apelsin-postgres psql -U apelsin_user -d apelsin_db << 'EOF'
SELECT 'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'order_items' as table_name, COUNT(*) as count FROM order_items
UNION ALL
SELECT 'products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'import_logs' as table_name, COUNT(*) as count FROM import_logs;
EOF

# Очистка изображений
echo "🖼️ Очистка всех изображений..."
rm -rf public/uploads/products/*
mkdir -p public/uploads/products

# Очистка кэша Next.js
echo "🧹 Очистка кэша приложения..."
rm -rf .next/cache/*

# Перезапуск всего приложения
echo "🚀 Полный перезапуск приложения..."
docker-compose down
docker-compose up -d

echo "✅ ПОЛНАЯ ОЧИСТКА ЗАВЕРШЕНА!"
echo "📊 База данных полностью пересоздана"
echo "🖼️ Все изображения удалены"
echo "🧹 Кэш очищен"
echo "🚀 Приложение перезапущено"
