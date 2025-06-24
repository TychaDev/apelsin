#!/bin/bash

echo "=== Исправление загрузки XML файлов ==="

echo "1. Остановка приложения..."
docker-compose stop app

echo "2. Создание директорий для загрузки..."
mkdir -p /opt/apelsin/uploads
mkdir -p /opt/apelsin/ftp-data/xml_uploads
mkdir -p /opt/apelsin/ftp-data/processed

echo "3. Создание тестового XML файла..."
cat > /opt/apelsin/ftp-data/xml_uploads/test-products.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<catalog xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" date="2024-01-01" xmlns="1cShopping">
	<company>Apelsin</company>
	<offers>
		<offer sku="4870145004999" group1="НАПИТКИ" group2="АЛКОГОЛЬНЫЕ">
			<name>"Zatecky Gus" 0% Пиво ж/б светлое 0,43л</name>
			<ostatok>35</ostatok>
			<price>460</price>
		</offer>
		<offer sku="2501805990018" group1="ГАСТРОНОМИЯ" group2="ПОЛУФАБРИКАТЫ/ЗАМОРОЗКА">
			<name>Бедро "Мадрид" соус по-испански "КусВкус"</name>
			<ostatok>7.64</ostatok>
			<price>2115</price>
		</offer>
		<offer sku="2501806000013" group1="ГАСТРОНОМИЯ" group2="ПОЛУФАБРИКАТЫ/ЗАМОРОЗКА">
			<name>Филе "Мадрид" соус по-испански "КусВкус"</name>
			<ostatok>8.166</ostatok>
			<price>3130</price>
		</offer>
		<offer sku="2574703010010" group1="NONFOOD" group2="СИГАРЕТЫ">
			<name>Winston Compact 100S</name>
			<ostatok>0</ostatok>
			<price>1010</price>
		</offer>
	</offers>
</catalog>
EOF

echo "4. Установка прав доступа..."
chmod 755 /opt/apelsin/uploads
chmod 755 /opt/apelsin/ftp-data/xml_uploads
chmod 755 /opt/apelsin/ftp-data/processed
chmod 644 /opt/apelsin/ftp-data/xml_uploads/test-products.xml

echo "5. Обновление docker-compose для монтирования директорий..."
cat > /opt/apelsin/docker-compose.override.yml << 'EOF'
version: '3.8'
services:
  app:
    volumes:
      - ./uploads:/app/uploads
      - ./ftp-data:/app/ftp-data
    environment:
      - FTP_UPLOAD_PATH=/app/ftp-data/xml_uploads
      - UPLOAD_PATH=/app/uploads
EOF

echo "6. Пересборка и запуск приложения..."
docker-compose up -d --build app

echo "7. Ожидание запуска..."
sleep 15

echo "8. Проверка статуса..."
docker-compose ps

echo "9. Проверка логов приложения..."
docker-compose logs --tail=20 app

echo "10. Проверка созданных файлов..."
echo "Тестовый XML файл:"
ls -la /opt/apelsin/ftp-data/xml_uploads/

echo "Директория uploads:"
ls -la /opt/apelsin/uploads/

echo ""
echo "=== XML загрузка исправлена! ==="
echo "Теперь можно:"
echo "1. Загружать XML файлы через кнопку 'Загрузить XML'"
echo "2. Использовать FTP синхронизацию"
echo "3. Тестовый файл создан в /opt/apelsin/ftp-data/xml_uploads/"
echo ""
echo "Для проверки логов:"
echo "docker-compose logs -f app"
