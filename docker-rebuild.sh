#!/bin/bash

echo "🔄 Остановка контейнеров..."
docker-compose down

echo "🗑️ Удаление старых образов..."
docker rmi apelsin-app:latest 2>/dev/null || true

echo "🏗️ Пересборка с нуля..."
docker-compose build --no-cache

echo "🚀 Запуск контейнеров..."
docker-compose up -d

echo "📊 Проверка статуса..."
docker-compose ps

echo "📝 Логи приложения:"
docker-compose logs app
