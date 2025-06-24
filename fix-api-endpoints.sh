#!/bin/bash

echo "🔧 ИСПРАВЛЕНИЕ API ENDPOINTS..."
echo "================================"

# Остановка приложения
echo "⏹️ Остановка приложения..."
docker-compose down

# Создание директорий для изображений
echo "📁 Создание директорий для изображений..."
mkdir -p public/uploads/products
chmod 755 public/uploads/products

# Создание FTP директории
echo "📁 Создание FTP директории..."
mkdir -p ftp-data/home/apelsin_xml/xml_uploads
chmod 755 ftp-data/home/apelsin_xml/xml_uploads

# Создание тестового XML файла
echo "📄 Создание тестового XML файла..."
cat > ftp-data/home/apelsin_xml/xml_uploads/test-products.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<catalog date="2024-01-01" xmlns="1cShopping">
  <company>Apelsin</company>
  <offers>
    <offer sku="TEST001" group1="ТЕСТ" group2="КАТЕГОРИЯ">
      <name>Тестовый товар 1</name>
      <ostatok>100</ostatok>
      <price>1000</price>
    </offer>
    <offer sku="TEST002" group1="НАПИТКИ" group2="БЕЗАЛКОГОЛЬНЫЕ">
      <name>Кока-кола 0.5л</name>
      <ostatok>50</ostatok>
      <price>350</price>
    </offer>
    <offer sku="TEST003" group1="ПРОДУКТЫ" group2="МОЛОЧНЫЕ">
      <name>Молоко 1л</name>
      <ostatok>25</ostatok>
      <price>450</price>
    </offer>
  </offers>
</catalog>
EOF

# Очистка кэша Next.js
echo "🧹 Очистка кэша Next.js..."
rm -rf .next
rm -rf node_modules/.cache

# Пересборка приложения
echo "🔨 Пересборка приложения..."
docker-compose build --no-cache

# Запуск приложения
echo "🚀 Запуск приложения..."
docker-compose up -d

# Ожидание запуска
echo "⏳ Ожидание запуска приложения..."
sleep 10

# Проверка статуса
echo "📊 Проверка статуса контейнеров..."
docker-compose ps

# Проверка API endpoints
echo "🔍 Проверка API endpoints..."
echo "Проверка /api/products..."
curl -s http://localhost:3000/api/products | head -c 100
echo ""

echo "Проверка /api/products/ftp-sync..."
curl -s http://localhost:3000/api/products/ftp-sync | head -c 100
echo ""

# Проверка директорий
echo "📁 Проверка созданных директорий..."
ls -la public/uploads/products/ 2>/dev/null || echo "Директория public/uploads/products не найдена"
ls -la ftp-data/home/apelsin_xml/xml_uploads/ 2>/dev/null || echo "Директория ftp-data не найдена"

echo ""
echo "✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo "================================"
echo "🔧 API endpoints обновлены"
echo "📁 Директории созданы"
echo "🖼️ Поддержка изображений включена"
echo "📄 Тестовый XML файл создан"
echo ""
echo "🔍 Для проверки:"
echo "1. Откройте раздел 'Товары'"
echo "2. Нажмите 'Проверить FTP'"
echo "3. Попробуйте загрузить изображение"
echo ""
