#!/bin/bash

echo "🚀 НАСТРОЙКА ПРОДВИНУТОЙ АВТОСИНХРОНИЗАЦИИ..."

# Останавливаем старый таймер если есть
systemctl stop apelsin-ftp-sync.timer 2>/dev/null
systemctl disable apelsin-ftp-sync.timer 2>/dev/null

# Создаем продвинутый скрипт синхронизации
cat > /opt/apelsin/advanced-ftp-sync.sh << 'EOF'
#!/bin/bash

# Конфигурация
LOG_FILE="/var/log/apelsin-ftp-sync.log"
LOCK_FILE="/tmp/apelsin-sync.lock"
FTP_DIR="/opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads"
PROCESSED_DIR="$FTP_DIR/processed"
CHECKSUM_FILE="/tmp/apelsin-checksums.txt"

# Функция логирования
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" >> $LOG_FILE
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1"
}

# Проверка блокировки
if [ -f "$LOCK_FILE" ]; then
    log "Синхронизация уже выполняется, пропускаем"
    exit 0
fi

# Создаем блокировку
echo $$ > "$LOCK_FILE"

# Функция очистки при выходе
cleanup() {
    rm -f "$LOCK_FILE"
}
trap cleanup EXIT

log "Запуск продвинутой автосинхронизации FTP..."

# Переходим в директорию приложения
cd /opt/apelsin

# Проверяем что приложение запущено
if ! docker-compose ps | grep -q "Up"; then
    log "Приложение не запущено, пропускаем синхронизацию"
    exit 0
fi

# Создаем FTP директорию если не существует
mkdir -p "$FTP_DIR"
mkdir -p "$PROCESSED_DIR"

# Проверяем наличие XML файлов
XML_FILES=$(find "$FTP_DIR" -maxdepth 1 -name "*.xml" ! -name "processed_*" 2>/dev/null)

if [ -z "$XML_FILES" ]; then
    log "XML файлы не найдены"
    exit 0
fi

# Проверяем изменения файлов
CURRENT_CHECKSUMS=$(find "$FTP_DIR" -maxdepth 1 -name "*.xml" ! -name "processed_*" -exec md5sum {} \; 2>/dev/null | sort)

if [ -f "$CHECKSUM_FILE" ]; then
    PREVIOUS_CHECKSUMS=$(cat "$CHECKSUM_FILE")
    if [ "$CURRENT_CHECKSUMS" = "$PREVIOUS_CHECKSUMS" ]; then
        log "Файлы не изменились, пропускаем синхронизацию"
        exit 0
    fi
fi

# Сохраняем новые контрольные суммы
echo "$CURRENT_CHECKSUMS" > "$CHECKSUM_FILE"

log "Обнаружены изменения в XML файлах, запускаем синхронизацию..."

# Вызываем API синхронизации с таймаутом
RESPONSE=$(timeout 60 curl -s -w "%{http_code}" -o /tmp/sync_response.json -X POST http://localhost:3000/api/products/ftp-sync)
HTTP_CODE="${RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    if [ -f /tmp/sync_response.json ]; then
        SUCCESS=$(cat /tmp/sync_response.json | grep -o '"success":[^,]*' | cut -d':' -f2)
        PROCESSED=$(cat /tmp/sync_response.json | grep -o '"processed":[^,]*' | cut -d':' -f2)
        
        if [ "$SUCCESS" = "true" ]; then
            log "Синхронизация успешна - обработано товаров: $PROCESSED"
            
            # Обновляем статистику панели управления
            curl -s http://localhost:3000/api/dashboard/stats > /dev/null
            log "Статистика панели управления обновлена"
        else
            ERROR_MSG=$(cat /tmp/sync_response.json | grep -o '"message":[^,]*' | cut -d':' -f2 | tr -d '"')
            log "Ошибка синхронизации: $ERROR_MSG"
        fi
    else
        log "Синхронизация успешна, но ответ не получен"
    fi
else
    log "Ошибка синхронизации - HTTP код: $HTTP_CODE"
    if [ -f /tmp/sync_response.json ]; then
        log "Ответ сервера: $(cat /tmp/sync_response.json)"
    fi
fi

# Очищаем временные файлы
rm -f /tmp/sync_response.json

log "Автосинхронизация завершена"
EOF

# Делаем скрипт исполняемым
chmod +x /opt/apelsin/advanced-ftp-sync.sh

echo "✅ Продвинутый скрипт синхронизации создан"

# Создаем новый systemd сервис
cat > /etc/systemd/system/apelsin-advanced-sync.service << EOF
[Unit]
Description=Apelsin Advanced FTP Auto Sync Service
After=network.target docker.service

[Service]
Type=oneshot
ExecStart=/opt/apelsin/advanced-ftp-sync.sh
User=root
StandardOutput=journal
StandardError=journal
TimeoutStartSec=120

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Новый systemd сервис создан"

# Создаем новый systemd таймер (каждую минуту)
cat > /etc/systemd/system/apelsin-advanced-sync.timer << EOF
[Unit]
Description=Apelsin Advanced FTP Auto Sync Timer
Requires=apelsin-advanced-sync.service

[Timer]
OnBootSec=1min
OnUnitActiveSec=1min
Persistent=true

[Install]
WantedBy=timers.target
EOF

echo "✅ Новый systemd таймер создан (каждую минуту)"

# Создаем директорию для логов
mkdir -p /var/log
touch /var/log/apelsin-ftp-sync.log
chmod 644 /var/log/apelsin-ftp-sync.log

# Создаем FTP директории
mkdir -p /opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads
mkdir -p /opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads/processed

echo "✅ FTP директории созданы"

# Перезагружаем systemd
systemctl daemon-reload

# Включаем и запускаем новый таймер
systemctl enable apelsin-advanced-sync.timer
systemctl start apelsin-advanced-sync.timer

echo "✅ Продвинутая автосинхронизация включена"

# Создаем тестовый XML файл
cat > /opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads/test-sync.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<catalog date="2024-01-01" xmlns="1cShopping">
  <company>Apelsin Test</company>
  <offers>
    <offer sku="SYNC001" group1="ТЕСТ" group2="АВТОСИНХРОНИЗАЦИЯ">
      <name>Тестовый товар автосинхронизации</name>
      <ostatok>999</ostatok>
      <price>1500</price>
    </offer>
    <offer sku="SYNC002" group1="НАПИТКИ" group2="ГАЗИРОВАННЫЕ">
      <name>Пепси-кола 0.5л</name>
      <ostatok>200</ostatok>
      <price>400</price>
    </offer>
    <offer sku="SYNC003" group1="СНЕКИ" group2="ЧИПСЫ">
      <name>Чипсы Lays классические</name>
      <ostatok>150</ostatok>
      <price>600</price>
    </offer>
  </offers>
</catalog>
EOF

echo "✅ Тестовый XML файл создан"

# Проверяем статус
echo ""
echo "📊 СТАТУС ПРОДВИНУТОЙ АВТОСИНХРОНИЗАЦИИ:"
systemctl status apelsin-advanced-sync.timer --no-pager

echo ""
echo "🔍 КОМАНДЫ ДЛЯ УПРАВЛЕНИЯ:"
echo "Статус:           systemctl status apelsin-advanced-sync.timer"
echo "Логи (реальное время): journalctl -u apelsin-advanced-sync.service -f"
echo "Логи (файл):      tail -f /var/log/apelsin-ftp-sync.log"
echo "Остановить:       systemctl stop apelsin-advanced-sync.timer"
echo "Запустить:        systemctl start apelsin-advanced-sync.timer"
echo "Ручной запуск:    /opt/apelsin/advanced-ftp-sync.sh"

echo ""
echo "📁 FTP ДИРЕКТОРИЯ:"
echo "Путь: /opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads/"
echo "Обработанные: /opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads/processed/"

echo ""
echo "✅ ПРОДВИНУТАЯ АВТОСИНХРОНИЗАЦИЯ НАСТРОЕНА!"
echo "🕐 XML файлы будут проверяться каждую минуту"
echo "🔍 Система отслеживает изменения файлов по контрольным суммам"
echo "📊 Автоматическое обновление статистики панели управления"

# Запускаем первую синхронизацию
echo ""
echo "🚀 Запускаем первую синхронизацию..."
/opt/apelsin/advanced-ftp-sync.sh
