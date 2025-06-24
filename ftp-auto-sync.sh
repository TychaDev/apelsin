#!/bin/bash

# Логирование
LOG_FILE="/var/log/apelsin-ftp-sync.log"
echo "$(date): Запуск автосинхронизации FTP..." >> $LOG_FILE

# Переходим в директорию приложения
cd /opt/apelsin

# Проверяем что приложение запущено
if ! docker-compose ps | grep -q "Up"; then
    echo "$(date): Приложение не запущено, пропускаем синхронизацию" >> $LOG_FILE
    exit 0
fi

# Вызываем API синхронизации
RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/sync_response.json http://localhost:3000/api/products/ftp-sync)
HTTP_CODE="${RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    RESULT=$(cat /tmp/sync_response.json)
    echo "$(date): Синхронизация успешна - $RESULT" >> $LOG_FILE
else
    echo "$(date): Ошибка синхронизации - HTTP код: $HTTP_CODE" >> $LOG_FILE
    if [ -f /tmp/sync_response.json ]; then
        echo "$(date): Ответ сервера: $(cat /tmp/sync_response.json)" >> $LOG_FILE
    fi
fi

# Очищаем временный файл
rm -f /tmp/sync_response.json

echo "$(date): Автосинхронизация завершена" >> $LOG_FILE
