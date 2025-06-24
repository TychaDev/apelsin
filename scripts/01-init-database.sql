-- Создание базы данных для системы управления доставкой Апельсин
-- Этот скрипт выполняется автоматически при первом запуске PostgreSQL

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

-- Вставка администратора и менеджера по умолчанию
INSERT INTO users (name, email, password_hash, role) VALUES 
('Администратор Апельсин', 'admin@apelsin.kz', crypt('8174126811dda', gen_salt('bf')), 'admin'),
('Менеджер Апельсин', 'manager@apelsin.kz', crypt('manager123', gen_salt('bf')), 'manager')
ON CONFLICT (email) DO NOTHING;

-- Вставка тестовых данных
INSERT INTO products (sku, name, category1, category2, price, stock) VALUES
('4870145004999', '"Zatecky Gus" 0% Пиво ж/б светлое 0,43л', 'НАПИТКИ', 'АЛКОГОЛЬНЫЕ', 460.00, 35.000),
('2501805990018', 'Бедро "Мадрид" соус по-испански "КусВкус"', 'ГАСТРОНОМИЯ', 'ПОЛУФАБРИКАТЫ/ЗАМОРОЗКА', 2115.00, 7.640),
('2501806000013', 'Филе "Мадрид" соус по-испански "КусВкус"', 'ГАСТРОНОМИЯ', 'ПОЛУФАБРИКАТЫ/ЗАМОРОЗКА', 3130.00, 8.166),
('2574703010010', 'Winston Compact 100S', 'NONFOOD', 'СИГАРЕТЫ', 1010.00, 0.000),
('2501807460014', 'Русский стиль by Richmond Blue Edition 100', 'NONFOOD', 'СИГАРЕТЫ', 1025.00, 0.000)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO orders (order_number, customer_name, customer_phone, total_amount, payment_method, status) VALUES
('ORD-001', 'Иван Петров', '+77771234567', 1500.00, 'Kaspi Bank', 'assembly'),
('ORD-002', 'Анна Сидорова', '+77779876543', 2300.00, 'Halyk Bank', 'waiting_courier'),
('ORD-003', 'Петр Иванов', '+77775555555', 890.00, 'Наличные', 'in_delivery')
ON CONFLICT (order_number) DO NOTHING;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO apelsin_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO apelsin_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO apelsin_user;
