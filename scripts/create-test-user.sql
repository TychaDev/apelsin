-- Создание тестового пользователя для входа в систему
-- Пароль: manager123

INSERT INTO users (name, email, password_hash, role, created_at) 
VALUES (
  'Менеджер Апельсин',
  'manager@apelsin.kz',
  '$2a$12$LQv3c1yqBwlVHpPjrGNDve/.VdqGVqfqx/PciLHUOgP5iBkxf2Eim', -- manager123
  'manager',
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name;

-- Создание администратора
INSERT INTO users (name, email, password_hash, role, created_at) 
VALUES (
  'Администратор',
  'admin@apelsin.kz',
  '$2a$12$8174126811dda.VdqGVqfqx/PciLHUOgP5iBkxf2Eim', -- 8174126811dda
  'admin',
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name;
