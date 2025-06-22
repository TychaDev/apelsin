# Исправление ошибки Docker

## Проблема
Ошибка `npm ci` возникает из-за отсутствия `package-lock.json` файла.

## Решение

### 1. Создайте package-lock.json
\`\`\`bash
cd /opt/apelsin
npm install
\`\`\`

### 2. Или используйте исправленный Dockerfile
\`\`\`bash
chmod +x package-lock-fix.sh
./package-lock-fix.sh
\`\`\`

### 3. Пересоберите контейнеры
\`\`\`bash
docker-compose down
docker-compose up -d --build
\`\`\`

### 4. Проверьте статус
\`\`\`bash
docker-compose ps
docker-compose logs app
\`\`\`

## Альтернативное решение
Если проблема продолжается, используйте обычную установку:

\`\`\`dockerfile
# Замените в Dockerfile строку:
RUN npm ci --only=production

# На:
RUN npm install --production
\`\`\`

## Проверка работы
\`\`\`bash
curl http://localhost:3000
\`\`\`

Сайт должен открыться без ошибок.
