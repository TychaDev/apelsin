#!/bin/bash

echo "=== Простое исправление FTP ==="

# Остановка всех контейнеров
echo "1. Остановка контейнеров..."
docker-compose down

# Очистка данных FTP
echo "2. Очистка FTP данных..."
sudo rm -rf /opt/apelsin/ftp-data
sudo mkdir -p /opt/apelsin/ftp-data/home/apelsin_xml/xml_uploads
sudo chmod -R 777 /opt/apelsin/ftp-data

# Создание простого docker-compose с vsftpd
echo "3. Создание новой конфигурации FTP..."
cat > docker-compose-simple-ftp.yml << 'EOF'
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
    image: fauria/vsftpd
    ports:
      - "21:21"
      - "21100-21110:21100-21110"
    environment:
      - FTP_USER=apelsin_xml
      - FTP_PASS=Apelsin2024XML!
      - PASV_ADDRESS=37.233.85.193
      - PASV_MIN_PORT=21100
      - PASV_MAX_PORT=21110
    volumes:
      - /opt/apelsin/ftp-data/home/apelsin_xml:/home/vsftpd/apelsin_xml
    restart: unless-stopped

  ftp-sync:
    build: .
    command: node scripts/ftp-sync-simple.js
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://apelsin_user:apelsin_password@db:5432/apelsin_db?sslmode=disable
      - FTP_HOST=ftp
      - FTP_PORT=21
      - FTP_USER=apelsin_xml
      - FTP_PASSWORD=Apelsin2024XML!
      - FTP_DIRECTORY=/home/vsftpd/apelsin_xml/xml_uploads
    depends_on:
      - db
      - ftp
    volumes:
      - /opt/apelsin/ftp-data:/ftp-data
    restart: unless-stopped

volumes:
  postgres_data:
EOF

echo "4. Создание упрощенного FTP синхронизатора..."
cat > scripts/ftp-sync-simple.js << 'EOF'
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Настройка подключения к базе данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Функция парсинга XML
function parseXML(xmlContent) {
  const products = [];
  
  // Простой парсинг XML без внешних библиотек
  const offerMatches = xmlContent.match(/<offer[^>]*>[\s\S]*?<\/offer>/g);
  
  if (offerMatches) {
    offerMatches.forEach(offer => {
      const sku = offer.match(/sku="([^"]*)"/) ? offer.match(/sku="([^"]*)"/)[1] : '';
      const group1 = offer.match(/group1="([^"]*)"/) ? offer.match(/group1="([^"]*)"/)[1] : '';
      const group2 = offer.match(/group2="([^"]*)"/) ? offer.match(/group2="([^"]*)"/)[1] : '';
      const name = offer.match(/<name>(.*?)<\/name>/) ? offer.match(/<name>(.*?)<\/name>/)[1] : '';
      const ostatok = offer.match(/<ostatok>(.*?)<\/ostatok>/) ? offer.match(/<ostatok>(.*?)<\/ostatok>/)[1] : '0';
      const price = offer.match(/<price>(.*?)<\/price>/) ? offer.match(/<price>(.*?)<\/price>/)[1] : '0';
      
      if (sku && name) {
        products.push({
          sku,
          name,
          category: group1,
          subcategory: group2,
          quantity: parseFloat(ostatok.replace(/\s/g, '').replace(',', '.')) || 0,
          price: parseFloat(price.replace(/\s/g, '').replace(',', '.')) || 0
        });
      }
    });
  }
  
  return products;
}

// Функция обновления товаров в базе
async function updateProducts(products) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const product of products) {
      await client.query(`
        INSERT INTO products (sku, name, category, subcategory, quantity, price, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (sku) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          subcategory = EXCLUDED.subcategory,
          quantity = EXCLUDED.quantity,
          price = EXCLUDED.price,
          updated_at = NOW()
      `, [product.sku, product.name, product.category, product.subcategory, product.quantity, product.price]);
    }
    
    await client.query('COMMIT');
    console.log(`Обновлено ${products.length} товаров`);
    
    // Логирование импорта
    await client.query(`
      INSERT INTO import_logs (filename, products_count, status, message, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, ['auto-sync', products.length, 'success', `Успешно импортировано ${products.length} товаров`]);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка обновления товаров:', error);
    
    // Логирование ошибки
    await client.query(`
      INSERT INTO import_logs (filename, products_count, status, message, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, ['auto-sync', 0, 'error', error.message]);
    
  } finally {
    client.release();
  }
}

// Основная функция синхронизации
async function syncFTP() {
  const ftpDir = '/ftp-data/home/apelsin_xml/xml_uploads';
  
  try {
    if (!fs.existsSync(ftpDir)) {
      console.log('FTP директория не найдена, создаем...');
      fs.mkdirSync(ftpDir, { recursive: true });
      return;
    }
    
    const files = fs.readdirSync(ftpDir);
    const xmlFiles = files.filter(file => file.endsWith('.xml'));
    
    if (xmlFiles.length === 0) {
      console.log('XML файлы не найдены');
      return;
    }
    
    console.log(`Найдено ${xmlFiles.length} XML файлов для обработки`);
    
    for (const file of xmlFiles) {
      const filePath = path.join(ftpDir, file);
      console.log(`Обработка файла: ${file}`);
      
      try {
        const xmlContent = fs.readFileSync(filePath, 'utf8');
        const products = parseXML(xmlContent);
        
        if (products.length > 0) {
          await updateProducts(products);
          
          // Перемещение обработанного файла
          const processedDir = path.join(ftpDir, 'processed');
          if (!fs.existsSync(processedDir)) {
            fs.mkdirSync(processedDir);
          }
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const newFileName = `${timestamp}_${file}`;
          fs.renameSync(filePath, path.join(processedDir, newFileName));
          
          console.log(`Файл ${file} обработан и перемещен`);
        } else {
          console.log(`В файле ${file} не найдено товаров`);
        }
        
      } catch (error) {
        console.error(`Ошибка обработки файла ${file}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Ошибка синхронизации FTP:', error);
  }
}

// Запуск синхронизации каждые 2 минуты
console.log('FTP синхронизация запущена...');
setInterval(syncFTP, 2 * 60 * 1000); // 2 минуты

// Первый запуск через 10 секунд
setTimeout(syncFTP, 10000);
EOF

echo "5. Запуск новой конфигурации..."
docker-compose -f docker-compose-simple-ftp.yml up -d --build

echo "6. Ожидание запуска..."
sleep 15

echo "7. Проверка статуса..."
docker-compose -f docker-compose-simple-ftp.yml ps

echo "8. Создание тестового файла..."
cat > test.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<catalog date="2024-01-01" xmlns="1cShopping">
  <company>Apelsin</company>
  <offers>
    <offer sku="TEST001" group1="ТЕСТ" group2="КАТЕГОРИЯ">
      <name>Тестовый товар</name>
      <ostatok>100</ostatok>
      <price>1000</price>
    </offer>
  </offers>
</catalog>
EOF

echo "9. Тестирование FTP..."
curl -T test.xml ftp://apelsin_xml:Apelsin2024XML!@37.233.85.193/xml_uploads/

echo ""
echo "=== FTP настроен с vsftpd! ==="
echo "Хост: 37.233.85.193"
echo "Порт: 21"
echo "Пользователь: apelsin_xml"
echo "Пароль: Apelsin2024XML!"
echo "Папка: xml_uploads"
echo ""
echo "Пассивные порты: 21100-21110"
echo ""
echo "Проверка логов:"
echo "docker-compose -f docker-compose-simple-ftp.yml logs -f ftp"
echo "docker-compose -f docker-compose-simple-ftp.yml logs -f ftp-sync"
