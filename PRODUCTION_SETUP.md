# Полная инструкция по установке системы "Апельсин" на VDS

## 1. Подготовка сервера

### Системные требования
- Ubuntu 20.04 LTS или новее
- Минимум 2GB RAM
- 20GB свободного места на диске
- Доступ root или sudo

### Обновление системы
\`\`\`bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget git unzip -y
\`\`\`

## 2. Установка Docker и Docker Compose

\`\`\`bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезагрузка для применения изменений
sudo reboot
\`\`\`

## 3. Клонирование и настройка проекта

\`\`\`bash
# Создание директории проекта
sudo mkdir -p /opt/apelsin
sudo chown $USER:$USER /opt/apelsin
cd /opt/apelsin

# Клонирование проекта (замените на ваш репозиторий)
git clone https://github.com/your-username/apelsin-delivery.git .

# Создание файла окружения
cp .env.example .env
nano .env
\`\`\`

### Настройка .env файла
\`\`\`env
# База данных
DATABASE_URL="postgresql://apelsin_user:ApelsinDelivery2024!@db:5432/apelsin_db"

# JWT секрет (сгенерируйте уникальный)
JWT_SECRET="ваш-уникальный-секретный-ключ-длиной-минимум-32-символа"

# FTP настройки
FTP_HOST="ftp"
FTP_PORT="21"
FTP_USER="apelsin_ftp"
FTP_PASSWORD="надежный-пароль-для-ftp"
FTP_DIRECTORY="/xml_uploads"

# Настройки приложения
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://ваш-домен.com"
\`\`\`

## 4. Настройка SSL сертификатов

### Создание самоподписанного сертификата (для тестирования)
\`\`\`bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=KZ/ST=Almaty/L=Almaty/O=Apelsin/CN=ваш-домен.com"
\`\`\`

### Или получение Let's Encrypt сертификата (для продакшена)
\`\`\`bash
sudo apt install certbot -y
sudo certbot certonly --standalone -d ваш-домен.com
sudo cp /etc/letsencrypt/live/ваш-домен.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/ваш-домен.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*
\`\`\`

## 5. Запуск приложения

\`\`\`bash
# Сборка и запуск контейнеров
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f app
\`\`\`

## 6. Настройка файрвола

\`\`\`bash
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 21      # FTP
sudo ufw allow 30000:30009/tcp  # FTP пассивный режим
sudo ufw enable
\`\`\`

## 7. Создание FTP пользователя для загрузки XML

FTP сервер уже настроен в Docker Compose. Для подключения используйте:
- **Хост**: IP вашего сервера
- **Порт**: 21
- **Пользователь**: apelsin_ftp
- **Пароль**: тот что указали в .env файле
- **Папка для XML**: /xml_uploads

### Тестирование FTP подключения
\`\`\`bash
# Установка FTP клиента для тестирования
sudo apt install ftp -y

# Подключение к FTP
ftp localhost
# Введите: apelsin_ftp и пароль
# Команды: ls, cd xml_uploads, put файл.xml, quit
\`\`\`

## 8. Настройка автоматического резервного копирования

\`\`\`bash
# Создание скрипта резервного копирования
sudo nano /opt/apelsin/backup.sh
\`\`\`

\`\`\`bash
#!/bin/bash
BACKUP_DIR="/opt/apelsin/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Резервное копирование базы данных
docker-compose exec -T db pg_dump -U apelsin_user apelsin_db > $BACKUP_DIR/db_backup_$DATE.sql

# Резервное копирование загруженных файлов
docker-compose exec -T ftp tar -czf - /home/apelsin_ftp > $BACKUP_DIR/ftp_backup_$DATE.tar.gz

# Удаление старых резервных копий (старше 7 дней)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Резервное копирование завершено: $DATE"
\`\`\`

\`\`\`bash
# Установка прав на выполнение
chmod +x /opt/apelsin/backup.sh

# Добавление в cron (ежедневно в 2:00)
sudo crontab -e
# Добавьте строку:
0 2 * * * /opt/apelsin/backup.sh >> /var/log/apelsin-backup.log 2>&1
\`\`\`

## 9. Мониторинг и логи

\`\`\`bash
# Просмотр логов приложения
docker-compose logs -f app

# Просмотр логов базы данных
docker-compose logs -f db

# Просмотр логов FTP
docker-compose logs -f ftp

# Мониторинг ресурсов
docker stats

# Проверка места на диске
df -h
\`\`\`

## 10. Обновление приложения

\`\`\`bash
cd /opt/apelsin

# Остановка контейнеров
docker-compose down

# Обновление кода
git pull origin main

# Пересборка и запуск
docker-compose up -d --build

# Проверка статуса
docker-compose ps
\`\`\`

## 11. Настройка домена и DNS

1. Добавьте A-запись в DNS вашего домена, указывающую на IP сервера
2. Дождитесь распространения DNS (до 24 часов)
3. Обновите SSL сертификат для вашего домена

## 12. Первый вход в систему

1. Откройте браузер и перейдите на https://ваш-домен.com
2. Войдите используя учетные данные:
   - **Администратор**: admin@apelsin.kz / admin123
   - **Менеджер**: manager@apelsin.kz / manager123

## 13. Настройка FTP для 1С интеграции

### Для подключения из 1С:
1. В настройках 1С укажите:
   - **FTP сервер**: IP вашего сервера
   - **Порт**: 21
   - **Пользователь**: apelsin_ftp
   - **Пароль**: из .env файла
   - **Папка**: /xml_uploads

2. Настройте автоматическую выгрузку XML каждые 5-10 минут

## 14. Устранение неполадок

### Проблемы с подключением к базе данных
\`\`\`bash
# Проверка статуса контейнера БД
docker-compose logs db

# Подключение к базе данных
docker-compose exec db psql -U apelsin_user -d apelsin_db
\`\`\`

### Проблемы с FTP
\`\`\`bash
# Проверка статуса FTP сервера
docker-compose logs ftp

# Проверка портов
sudo netstat -tlnp | grep :21
\`\`\`

### Проблемы с SSL
\`\`\`bash
# Проверка сертификата
openssl x509 -in ssl/cert.pem -text -noout

# Обновление сертификата Let's Encrypt
sudo certbot renew
\`\`\`

## 15. Безопасность

### Изменение паролей по умолчанию
1. Войдите в систему как администратор
2. Перейдите в настройки
3. Измените пароли для всех пользователей

### Настройка fail2ban (защита от брутфорса)
\`\`\`bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
\`\`\`

## 16. Производительность

### Оптимизация PostgreSQL
\`\`\`bash
# Редактирование конфигурации
docker-compose exec db nano /var/lib/postgresql/data/postgresql.conf

# Рекомендуемые настройки для 2GB RAM:
# shared_buffers = 512MB
# effective_cache_size = 1536MB
# maintenance_work_mem = 128MB
# checkpoint_completion_target = 0.9
# wal_buffers = 16MB
\`\`\`

### Мониторинг производительности
\`\`\`bash
# Установка htop для мониторинга
sudo apt install htop -y

# Мониторинг в реальном времени
htop
\`\`\`

## Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs`
2. Проверьте статус сервисов: `docker-compose ps`
3. Проверьте место на диске: `df -h`
4. Проверьте память: `free -h`

Система готова к работе! 🚀
