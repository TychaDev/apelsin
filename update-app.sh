#!/bin/bash

echo "=== Обновление приложения Апельсин ==="

# Остановка контейнеров
echo "1. Остановка контейнеров..."
docker-compose down

# Очистка кэша Docker
echo "2. Очистка кэша..."
docker system prune -f
docker builder prune -f

# Пересборка приложения
echo "3. Пересборка приложения..."
docker-compose build --no-cache app

# Запуск контейнеров
echo "4. Запуск контейнеров..."
docker-compose up -d

# Ожидание запуска
echo "5. Ожидание запуска сервисов..."
sleep 30

# Проверка статуса
echo "6. Проверка статуса контейнеров..."
docker-compose ps

# Проверка логов
echo "7. Последние логи приложения:"
docker-compose logs --tail=20 app

echo ""
echo "=== Обновление завершено ==="
echo "Сайт доступен по адресу: http://$(curl -s ifconfig.me):3000"
echo ""
echo "Данные для входа:"
echo "Email: manager@apelsin.kz"
echo "Пароль: manager123"
echo ""
echo "Для просмотра логов: docker-compose logs -f app"
echo "Для перезапуска: docker-compose restart app"
