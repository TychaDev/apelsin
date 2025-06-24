#!/bin/bash

echo "=== Исправление FTP директории ==="

# Остановка контейнеров
echo "1. Остановка контейнеров..."
docker-compose down

# Создание FTP директорий
echo "2. Создание FTP директорий..."
sudo mkdir -p /opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads
sudo mkdir -p /opt/apelsin/ftp-data/etc
sudo mkdir -p /opt/apelsin/ftp-data/var/log

# Создание пользователя системы
echo "3. Создание системного пользователя..."
sudo useradd -m -s /bin/bash apelsin_xml 2>/dev/null || echo "Пользователь уже существует"
echo "apelsin_xml:Apelsin2024XML!" | sudo chpasswd

# Установка прав доступа
echo "4. Установка прав доступа..."
sudo chown -R apelsin_xml:apelsin_xml /opt/apelsin/ftp-data/home/apelsin_xml
sudo chmod 755 /opt/apelsin/ftp-data/home/apelsin_xml
sudo chmod 755 /opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads

# Создание тестового XML файла
echo "5. Создание тестового XML файла..."
cat > /opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads/test.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<catalog xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" date="2024-01-01" xmlns="1cShopping">
	<company>Apelsin</company>
	<offers>
		<offer sku="TEST001" group1="ТЕСТ" group2="КАТЕГОРИЯ">
			<name>Тестовый товар 1</name>
			<ostatok>50</ostatok>
			<price>1500</price>
		</offer>
		<offer sku="TEST002" group1="НАПИТКИ" group2="БЕЗАЛКОГОЛЬНЫЕ">
			<name>Тестовый напиток</name>
			<ostatok>100</ostatok>
			<price>500</price>
		</offer>
	</offers>
</catalog>
EOF

sudo chown apelsin_xml:apelsin_xml /opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads/test.xml

# Обновление docker-compose для правильного монтирования
echo "6. Обновление docker-compose..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: apelsin_db
      POSTGRES_USER: apelsin_user
      POSTGRES_PASSWORD: apelsin_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://apelsin_user:apelsin_password@db:5432/apelsin_db
      - JWT_SECRET=K8mN9pQ2rS5tU7vW0xY3zA6bC9dE2fG5hI8jK1lM4nO7pQ0rS3tU6vW9xY2zA5bC
      - FTP_HOST=ftp
      - FTP_PORT=21
      - FTP_USER=apelsin_xml
      - FTP_PASSWORD=Apelsin2024XML!
      - FTP_DIRECTORY=/xml_uploads
    depends_on:
      - db
    volumes:
      - ./ftp-data:/ftp-data
    restart: unless-stopped

  ftp:
    image: fauria/vsftpd
    environment:
      - FTP_USER=apelsin_xml
      - FTP_PASS=Apelsin2024XML!
      - PASV_ADDRESS=37.233.85.193
      - PASV_MIN_PORT=21100
      - PASV_MAX_PORT=21110
    ports:
      - "21:21"
      - "21100-21110:21100-21110"
    volumes:
      - ./ftp-data/home:/home
    restart: unless-stopped

volumes:
  postgres_data:
EOF

# Запуск контейнеров
echo "7. Запуск контейнеров..."
docker-compose up -d --build

# Ожидание запуска
echo "8. Ожидание запуска сервисов..."
sleep 30

# Проверка статуса
echo "9. Проверка статуса..."
docker-compose ps

echo ""
echo "=== FTP настроен! ==="
echo "Директория создана: /opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads"
echo "Тестовый файл: test.xml"
echo ""
echo "Данные для подключения:"
echo "Хост: 37.233.85.193"
echo "Порт: 21"
echo "Пользователь: apelsin_xml"
echo "Пароль: Apelsin2024XML!"
echo ""
echo "Для проверки:"
echo "ls -la /opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads/"
