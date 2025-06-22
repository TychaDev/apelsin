# Инструкция по установке системы управления доставкой "Апельсин"

## Системные требования

- Ubuntu 20.04 LTS или новее
- Node.js 18.x или новее
- PostgreSQL 13 или новее
- Nginx
- PM2 для управления процессами
- FTP сервер (vsftpd)

## Пошаговая установка

### 1. Обновление системы

\`\`\`bash
sudo apt update && sudo apt upgrade -y
\`\`\`

### 2. Установка Node.js

\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
\`\`\`

### 3. Установка PostgreSQL

\`\`\`bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Создание пользователя и базы данных
sudo -u postgres psql
CREATE USER apelsin_user WITH PASSWORD 'strong_password_here';
CREATE DATABASE apelsin_db OWNER apelsin_user;
GRANT ALL PRIVILEGES ON DATABASE apelsin_db TO apelsin_user;
\q
\`\`\`

### 4. Установка Nginx

\`\`\`bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
\`\`\`

### 5. Установка FTP сервера

\`\`\`bash
sudo apt install vsftpd -y

# Настройка vsftpd
sudo nano /etc/vsftpd.conf
\`\`\`

Добавьте в конфигурацию:
\`\`\`
listen=YES
listen_ipv6=NO
anonymous_enable=NO
local_enable=YES
write_enable=YES
local_umask=022
dirmessage_enable=YES
use_localtime=YES
xferlog_enable=YES
connect_from_port_20=YES
chroot_local_user=YES
secure_chroot_dir=/var/run/vsftpd/empty
pam_service_name=vsftpd
rsa_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem
rsa_private_key_file=/etc/ssl/private/ssl-cert-snakeoil.key
ssl_enable=NO
pasv_enable=Yes
pasv_min_port=10000
pasv_max_port=10100
allow_writeable_chroot=YES
\`\`\`

\`\`\`bash
sudo systemctl restart vsftpd
sudo systemctl enable vsftpd
\`\`\`

### 6. Создание FTP пользователя

\`\`\`bash
sudo adduser apelsin_ftp
sudo mkdir -p /home/apelsin_ftp/xml_uploads
sudo mkdir -p /home/apelsin_ftp/xml_uploads/processed
sudo chown apelsin_ftp:apelsin_ftp /home/apelsin_ftp/xml_uploads
sudo chmod 755 /home/apelsin_ftp/xml_uploads
\`\`\`

### 7. Установка PM2

\`\`\`bash
sudo npm install -g pm2
\`\`\`

### 8. Клонирование и настройка проекта

\`\`\`bash
cd /var/www
sudo git clone <your-repo-url> apelsin
sudo chown -R $USER:$USER /var/www/apelsin
cd apelsin

# Установка зависимостей
npm install

# Создание файла окружения
cp .env.example .env
nano .env
\`\`\`

Настройте .env файл:
\`\`\`env
DATABASE_URL="postgresql://apelsin_user:strong_password_here@localhost:5432/apelsin_db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://yourdomain.com"
FTP_HOST="localhost"
FTP_PORT="21"
FTP_USER="apelsin_ftp"
FTP_PASSWORD="ftp_password_here"
FTP_DIRECTORY="/xml_uploads"
\`\`\`

### 9. Инициализация базы данных

\`\`\`bash
# Выполнение SQL скрипта
psql -h localhost -U apelsin_user -d apelsin_db -f scripts/init-database.sql
\`\`\`

### 10. Сборка проекта

\`\`\`bash
npm run build
\`\`\`

### 11. Настройка PM2

\`\`\`bash
# Создание ecosystem файла
nano ecosystem.config.js
\`\`\`

\`\`\`javascript
module.exports = {
  apps: [{
    name: 'apelsin-delivery',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/apelsin',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }, {
    name: 'apelsin-ftp-sync',
    script: 'node',
    args: 'scripts/ftp-sync.js',
    cwd: '/var/www/apelsin',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
}
\`\`\`

\`\`\`bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

### 12. Настройка Nginx

\`\`\`bash
sudo nano /etc/nginx/sites-available/apelsin
\`\`\`

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
