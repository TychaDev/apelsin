# 🚀 Быстрый деплой на VDS

## 1. Подготовка сервера

\`\`\`bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезагрузка для применения изменений
sudo reboot
\`\`\`

## 2. Деплой приложения

\`\`\`bash
# Клонирование репозитория
cd /opt
sudo git clone https://github.com/your-username/apelsin.git
cd apelsin

# Создание .env файла
sudo cp .env.example .env
sudo nano .env  # Отредактируйте переменные

# Создание необходимых директорий
sudo mkdir -p uploads logs ssl ftp-config

# Установка прав доступа
sudo chown -R $USER:$USER /opt/apelsin
chmod +x docker-rebuild.sh

# Запуск
./docker-rebuild.sh
\`\`\`

## 3. Проверка работы

\`\`\`bash
# Проверка статуса контейнеров
docker-compose ps

# Просмотр логов
docker-compose logs -f app

# Проверка подключения к базе
docker-compose exec db psql -U apelsin_user -d apelsin_db -c "SELECT version();"

# Тест FTP
ftp localhost 21
# Логин: apelsin_ftp
# Пароль: ftp_password_123
\`\`\`

## 4. Настройка домена (опционально)

\`\`\`bash
# Установка Certbot для SSL
sudo apt install certbot -y

# Получение SSL сертификата
sudo certbot certonly --standalone -d yourdomain.com

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/

# Перезапуск nginx
docker-compose restart nginx
\`\`\`

## 5. Мониторинг

\`\`\`bash
# Просмотр использования ресурсов
docker stats

# Резервное копирование базы данных
docker-compose exec db pg_dump -U apelsin_user apelsin_db > backup_$(date +%Y%m%d).sql

# Очистка логов Docker
docker system prune -f
\`\`\`

## 🔧 Устранение неполадок

### Проблема с портами
\`\`\`bash
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :21
\`\`\`

### Проблема с правами доступа
\`\`\`bash
sudo chown -R 1001:1001 /opt/apelsin/uploads
sudo chmod -R 755 /opt/apelsin
\`\`\`

### Перезапуск всех сервисов
\`\`\`bash
docker-compose down
docker-compose up -d
