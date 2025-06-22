#!/bin/bash

# Скрипт для исправления проблемы с package-lock.json

echo "Исправление проблемы с Docker сборкой..."

# Создание package-lock.json
npm install

# Обновление Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm install --production

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN npm run build

# Создание пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Установка прав доступа
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV NODE_ENV production

CMD ["npm", "start"]
EOF

echo "Dockerfile обновлен!"
echo "Теперь запустите: docker-compose up -d --build"
