#!/bin/bash

echo "=== Тестирование FTP подключения ==="

# Создание тестового файла
echo "1. Создание тестового XML файла..."
cat > test-upload.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<catalog date="2024-01-01" xmlns="1cShopping">
  <company>Apelsin</company>
  <offers>
    <offer sku="TEST001" group1="ТЕСТ" group2="КАТЕГОРИЯ">
      <name>Тестовый товар FTP</name>
      <ostatok>50</ostatok>
      <price>1500</price>
    </offer>
  </offers>
</catalog>
EOF

echo "2. Тестирование подключения через curl..."
curl -v -T test-upload.xml ftp://apelsin_xml:Apelsin2024XML!@37.233.85.193/xml_uploads/

echo ""
echo "3. Проверка загруженного файла..."
curl -v ftp://apelsin_xml:Apelsin2024XML!@37.233.85.193/xml_uploads/

echo ""
echo "4. Проверка логов FTP сервера..."
docker-compose -f docker-compose-ftp-fixed.yml logs --tail=20 ftp

echo ""
echo "5. Проверка логов синхронизации..."
docker-compose -f docker-compose-ftp-fixed.yml logs --tail=20 ftp-sync

echo ""
echo "=== Тест завершен ==="
