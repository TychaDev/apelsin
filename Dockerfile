FROM node:18-alpine

# Установка зависимостей для компиляции native модулей
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-dev \
    libc6-compat

WORKDIR /app

# Копирование package.json
COPY package*.json ./

# Установка зависимостей
RUN npm install --omit=dev

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

ENV NODE_ENV=production

CMD ["npm", "start"]
