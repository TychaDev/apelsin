FROM node:18-alpine

# Установка системных зависимостей
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-dev \
    libc6-compat

WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование исходного кода
COPY . .

# Создание .env файла с переменными по умолчанию
RUN echo "DATABASE_URL=postgresql://apelsin_user:apelsin_password@postgres:5432/apelsin_db" > .env
RUN echo "JWT_SECRET=K8mN9pQ2rS5tU7vW0xY3zA6bC9dE2fG5hI8jK1lM4nO7pQ0rS3tU6vW9xY2zA5bC" >> .env
RUN echo "NEXTAUTH_SECRET=K8mN9pQ2rS5tU7vW0xY3zA6bC9dE2fG5hI8jK1lM4nO7pQ0rS3tU6vW9xY2zA5bC" >> .env
RUN echo "NEXTAUTH_URL=http://localhost:3000" >> .env

# Сборка приложения
RUN npm run build

# Создание пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Изменение владельца файлов
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
