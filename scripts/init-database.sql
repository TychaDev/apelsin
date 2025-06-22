-- Создание базы данных для системы управления доставкой Апельсин
-- Выполните этот скрипт от имени суперпользователя PostgreSQL

-- Создание пользователя и базы данных
CREATE USER apelsin_user WITH PASSWORD 'ApelsinDelivery2024!';
CREATE DATABASE apelsin_db OWNER apelsin_user;

-- Подключение к созданной базе данных
\c apelsin_db;

-- Предоставление прав пользователю
GRANT ALL PRIVILEGES ON DATABASE apelsin_db TO apelsin_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO apelsin_user;

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'manager',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    category1 VARCHAR(255),
    category2 VARCHAR(255),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    image_url VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'assembly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица позиций заказа
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(255),
    product_name VARCHAR(500) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL
);

-- Таблица настроек FTP
CREATE TABLE IF NOT EXISTS ftp_settings (
    id SERIAL PRIMARY KEY,
    host VARCHAR(255) NOT NULL,
    port INTEGER DEFAULT 21,
    username VARCHAR(255) NOT NULL,
    password_encrypted TEXT NOT NULL,
    directory VARCHAR(500) DEFAULT '/xml_uploads',
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица логов импорта
CREATE TABLE IF NOT EXISTS import_logs (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    products_imported INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category1, category2);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('russian', name));
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ftp_settings_updated_at BEFORE UPDATE ON ftp_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вставка администратора по умолчанию
INSERT INTO users (name, email, password_hash, role) VALUES 
('Администратор Апельсин', 'admin@apelsin.kz', crypt('admin123', gen_salt('bf')), 'admin'),
('Менеджер Апельсин', 'manager@apelsin.kz', crypt('manager123', gen_salt('bf')), 'manager')
ON CONFLICT (email) DO NOTHING;

-- Предоставление всех прав пользователю apelsin_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO apelsin_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO apelsin_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO apelsin_user;

-- Установка владельца для всех объектов
ALTER TABLE users OWNER TO apelsin_user;
ALTER TABLE products OWNER TO apelsin_user;
ALTER TABLE orders OWNER TO apelsin_user;
ALTER TABLE order_items OWNER TO apelsin_user;
ALTER TABLE ftp_settings OWNER TO apelsin_user;
ALTER TABLE import_logs OWNER TO apelsin_user;
