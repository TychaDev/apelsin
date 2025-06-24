#!/bin/bash

echo "=== Исправление FTP пользователей ==="

# Остановка FTP контейнера
echo "1. Остановка FTP сервера..."
docker-compose stop ftp

# Удаление старого контейнера и данных
echo "2. Очистка старых данных..."
docker-compose rm -f ftp
docker volume rm apelsin_ftp_data 2>/dev/null || true

# Создание директории для FTP данных
echo "3. Создание директорий..."
sudo mkdir -p /opt/apelsin/ftp-data/etc
sudo mkdir -p /opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads
sudo chmod 755 /opt/apelsin/ftp-data/home/apelsin_xml
sudo chmod 777 /opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads

# Создание конфигурации Pure-FTPd
echo "4. Создание конфигурации..."
cat > /opt/apelsin/ftp-data/etc/pure-ftpd.conf << 'EOF'
ChrootEveryone              yes
BrokenClientsCompatibility  no
MaxClientsNumber            50
Daemonize                   yes
MaxClientsPerIP             8
VerboseLog                  no
DisplayDotFiles             yes
AnonymousOnly               no
NoAnonymous                 yes
SyslogFacility              ftp
DontResolve                 yes
MaxIdleTime                 15
PureDB                      /etc/pure-ftpd/pureftpd.pdb
LimitRecursion              3136 8
AnonymousCanCreateDirs      no
MaxLoad                     4
AntiWarez                   yes
Umask                       133:022
MinUID                      100
AllowUserFXP                no
AllowAnonymousFXP           no
ProhibitDotFilesWrite       no
ProhibitDotFilesRead        no
AutoRename                  no
AnonymousCantUpload         no
PIDFile                     /var/run/pure-ftpd.pid
MaxDiskUsage                99
CustomerProof               yes
EOF

# Создание пользователя
echo "5. Создание FTP пользователя..."
docker run --rm -v /opt/apelsin/ftp-data:/ftp-data stilliard/pure-ftpd:hardened \
  sh -c "pure-pw useradd apelsin_xml -f /ftp-data/etc/pureftpd.passwd -m -u 1000 -g 1000 -d /home/apelsin_xml -s /bin/bash && \
         echo 'Apelsin2024XML!' | pure-pw passwd apelsin_xml -f /ftp-data/etc/pureftpd.passwd -m && \
         pure-pw mkdb /ftp-data/etc/pureftpd.pdb -f /ftp-data/etc/pureftpd.passwd"

echo "6. Установка прав доступа..."
sudo chown -R 1000:1000 /opt/apelsin/ftp-data/home/apelsin_xml
sudo chmod 755 /opt/apelsin/ftp-data/etc/pureftpd.pdb

echo "7. Обновление docker-compose..."
cat > docker-compose-ftp-fixed.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://apelsin_user:apelsin_password@db:5432/apelsin_db?sslmode=disable
      - JWT_SECRET=K8mN9pQ2rS5tU7vW0xY3zA6bC9dE2fG5hI8jK1lM4nO7pQ0rS3tU6vW9xY2zA5bC
      - FTP_HOST=ftp
      - FTP_PORT=21
      - FTP_USER=apelsin_xml
      - FTP_PASSWORD=Apelsin2024XML!
      - FTP_DIRECTORY=/home/apelsin_xml/xml_uploads
    depends_on:
      - db
      - ftp
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=apelsin_db
      - POSTGRES_USER=apelsin_user
      - POSTGRES_PASSWORD=apelsin_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped

  ftp:
    image: stilliard/pure-ftpd:hardened
    ports:
      - "21:21"
      - "30000-30009:30000-30009"
    environment:
      - PUBLICHOST=37.233.85.193
      - ADDED_FLAGS=-d -d
    volumes:
      - /opt/apelsin/ftp-data/home:/home
      - /opt/apelsin/ftp-data/etc/pureftpd.pdb:/etc/pure-ftpd/pureftpd.pdb:ro
      - /opt/apelsin/ftp-data/etc/pure-ftpd.conf:/etc/pure-ftpd/pure-ftpd.conf:ro
    restart: unless-stopped

  ftp-sync:
    build: .
    command: node scripts/ftp-sync-enhanced.js
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://apelsin_user:apelsin_password@db:5432/apelsin_db?sslmode=disable
      - FTP_HOST=ftp
      - FTP_PORT=21
      - FTP_USER=apelsin_xml
      - FTP_PASSWORD=Apelsin2024XML!
      - FTP_DIRECTORY=/home/apelsin_xml/xml_uploads
    depends_on:
      - db
      - ftp
    volumes:
      - /opt/apelsin/ftp-data/home:/ftp-data
    restart: unless-stopped

volumes:
  postgres_data:
EOF

echo "8. Запуск обновленной конфигурации..."
docker-compose -f docker-compose-ftp-fixed.yml up -d

echo "9. Ожидание запуска сервисов..."
sleep 10

echo "10. Проверка статуса..."
docker-compose -f docker-compose-ftp-fixed.yml ps

echo "11. Тестирование FTP подключения..."
timeout 10 ftp -n 37.233.85.193 << 'FTPEOF'
user apelsin_xml Apelsin2024XML!
pwd
ls
quit
FTPEOF

echo ""
echo "=== FTP настроен! ==="
echo "Хост: 37.233.85.193"
echo "Порт: 21"
echo "Пользователь: apelsin_xml"
echo "Пароль: Apelsin2024XML!"
echo "Папка для XML: /xml_uploads"
echo ""
echo "Для проверки логов FTP:"
echo "docker-compose -f docker-compose-ftp-fixed.yml logs -f ftp"
