#!/bin/bash

echo "=== Исправление загрузки товаров ==="

echo "1. Остановка приложения..."
docker-compose down

echo "2. Проверка базы данных..."
docker-compose up -d db
sleep 10

echo "3. Создание таблицы товаров если не существует..."
docker-compose exec -T db psql -U apelsin_user -d apelsin_db << 'EOF'
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500),
    category1 VARCHAR(255),
    category2 VARCHAR(255),
    price DECIMAL(10,2) DEFAULT 0,
    stock DECIMAL(10,3) DEFAULT 0,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем тестовые товары если таблица пустая
INSERT INTO products (sku, name, category1, category2, price, stock) 
SELECT * FROM (VALUES 
    ('TEST001', 'Тестовый товар 1', 'НАПИТКИ', 'БЕЗАЛКОГОЛЬНЫЕ', 500, 100),
    ('TEST002', 'Тестовый товар 2', 'ПРОДУКТЫ', 'МОЛОЧНЫЕ', 300, 50),
    ('TEST003', 'Тестовый товар 3', 'ХЛЕБ', 'ВЫПЕЧКА', 150, 25)
) AS t(sku, name, category1, category2, price, stock)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- Проверяем количество товаров
SELECT COUNT(*) as total_products FROM products;
EOF

echo "4. Создание директорий для загрузки..."
mkdir -p /opt/apelsin/uploads
mkdir -p /opt/apelsin/ftp-data/xml_uploads
chmod 755 /opt/apelsin/uploads
chmod 755 /opt/apelsin/ftp-data/xml_uploads

echo "5. Создание тестового XML файла..."
cat > /opt/apelsin/ftp-data/xml_uploads/test_products.xml << 'EOF'
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
    </offers>
</catalog>
EOF

echo "6. Обновление docker-compose для монтирования директорий..."
cat > docker-compose.override.yml << 'EOF'
version: '3.8'
services:
  app:
    volumes:
      - ./uploads:/app/uploads
      - ./ftp-data:/app/ftp-data
    environment:
      - UPLOAD_DIR=/app/uploads
      - FTP_DIR=/app/ftp-data/xml_uploads
EOF

echo "7. Пересборка и запуск приложения..."
docker-compose build --no-cache app
docker-compose up -d

echo "8. Ожидание запуска сервисов..."
sleep 15

echo "9. Проверка статуса контейнеров..."
docker-compose ps

echo "10. Проверка логов приложения..."
echo "--- Последние логи приложения ---"
docker-compose logs --tail=20 app

echo "11. Тестирование API товаров..."
echo "Тестируем GET /api/products..."
curl -s http://localhost:3000/api/products | head -200

echo ""
echo "=== Исправление завершено! ==="
echo ""
echo "Проверьте:"
echo "1. Откройте http://37.233.85.193:3000"
echo "2. Войдите в систему"
echo "3. Перейдите в раздел 'Товары'"
echo "4. Должны отображаться тестовые товары"
echo ""
echo "Для просмотра логов в реальном времени:"
echo "docker-compose logs -f app"
