-- Принудительная очистка всех заказов
BEGIN;

-- Показываем текущее состояние
SELECT 'Current orders count' as info, COUNT(*) FROM orders;
SELECT 'Current order_items count' as info, COUNT(*) FROM order_items;

-- Удаляем все связанные записи
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;

-- Сбрасываем последовательности
ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS order_items_id_seq RESTART WITH 1;

-- Проверяем результат
SELECT 'After cleanup - orders count' as info, COUNT(*) FROM orders;
SELECT 'After cleanup - order_items count' as info, COUNT(*) FROM order_items;

COMMIT;

-- Финальная проверка
SELECT 'Final verification' as status, 
       (SELECT COUNT(*) FROM orders) as orders_count,
       (SELECT COUNT(*) FROM order_items) as order_items_count;
