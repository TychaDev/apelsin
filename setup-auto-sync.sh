#!/bin/bash

echo "🔧 НАСТРОЙКА АВТОМАТИЧЕСКОЙ СИНХРОНИЗАЦИИ FTP..."

# Создаем скрипт автосинхронизации
cat > /opt/apelsin/ftp-auto-sync.sh << 'EOF'
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
EOF

# Делаем скрипт исполняемым
chmod +x /opt/apelsin/ftp-auto-sync.sh

echo "✅ Скрипт автосинхронизации создан"

# Создаем systemd сервис
cat > /etc/systemd/system/apelsin-ftp-sync.service << EOF
[Unit]
Description=Apelsin FTP Auto Sync Service
After=network.target docker.service

[Service]
Type=oneshot
ExecStart=/opt/apelsin/ftp-auto-sync.sh
User=root
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Systemd сервис создан"

# Создаем systemd таймер
cat > /etc/systemd/system/apelsin-ftp-sync.timer << EOF
[Unit]
Description=Apelsin FTP Auto Sync Timer
Requires=apelsin-ftp-sync.service

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
Persistent=true

[Install]
WantedBy=timers.target
EOF

echo "✅ Systemd таймер создан"

# Создаем директорию для логов
mkdir -p /var/log
touch /var/log/apelsin-ftp-sync.log
chmod 644 /var/log/apelsin-ftp-sync.log

echo "✅ Лог файл создан"

# Перезагружаем systemd
systemctl daemon-reload

# Включаем и запускаем таймер
systemctl enable apelsin-ftp-sync.timer
systemctl start apelsin-ftp-sync.timer

echo "✅ Автосинхронизация включена"

# Проверяем статус
echo "📊 СТАТУС АВТОСИНХРОНИЗАЦИИ:"
systemctl status apelsin-ftp-sync.timer --no-pager

echo ""
echo "🔍 КОМАНДЫ ДЛЯ УПРАВЛЕНИЯ:"
echo "Статус:     systemctl status apelsin-ftp-sync.timer"
echo "Логи:       journalctl -u apelsin-ftp-sync.service -f"
echo "Остановить: systemctl stop apelsin-ftp-sync.timer"
echo "Запустить:  systemctl start apelsin-ftp-sync.timer"
echo "Лог файл:   tail -f /var/log/apelsin-ftp-sync.log"

echo ""
echo "✅ АВТОСИНХРОНИЗАЦИЯ НАСТРОЕНА!"
echo "🕐 XML файлы будут проверяться каждые 2 минуты"
