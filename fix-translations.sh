#!/bin/bash

echo "🔧 Исправление системы переводов..."

# Остановка контейнеров
echo "⏹️ Остановка контейнеров..."
docker-compose down

# Очистка кэша
echo "🧹 Очистка кэша..."
docker system prune -f
docker builder prune -f

# Пересборка
echo "🔨 Пересборка приложения..."
docker-compose build --no-cache

# Запуск
echo "🚀 Запуск обновленного приложения..."
docker-compose up -d

# Ожидание запуска
echo "⏳ Ожидание запуска (30 секунд)..."
sleep 30

# Проверка статуса
echo "📊 Статус контейнеров:"
docker-compose ps

echo "📋 Логи приложения:"
docker-compose logs app --tail=20

echo "✅ Система переводов исправлена!"
echo "🌐 Сайт доступен по адресу: http://37.233.85.193:3000"
