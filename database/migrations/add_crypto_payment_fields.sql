-- Agregar campos para pagos con billetera cripto

-- Verificar y agregar campo 'payment_crypto_wallet'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'courses' 
   AND COLUMN_NAME = 'payment_crypto_wallet') = 0,
  'ALTER TABLE courses ADD COLUMN payment_crypto_wallet VARCHAR(255) NULL COMMENT ''Dirección de billetera cripto''',
  'SELECT "Column payment_crypto_wallet already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'payment_crypto_network'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'courses' 
   AND COLUMN_NAME = 'payment_crypto_network') = 0,
  'ALTER TABLE courses ADD COLUMN payment_crypto_network VARCHAR(50) NULL COMMENT ''Red de la criptomoneda (TRC20, ERC20, BEP20, etc.)''',
  'SELECT "Column payment_crypto_network already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'payment_crypto_currency'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'courses' 
   AND COLUMN_NAME = 'payment_crypto_currency') = 0,
  'ALTER TABLE courses ADD COLUMN payment_crypto_currency VARCHAR(20) NULL COMMENT ''Tipo de criptomoneda (USDT, BTC, ETH, etc.)''',
  'SELECT "Column payment_crypto_currency already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mensaje de confirmación
SELECT 'Migración de campos de pago cripto completada exitosamente' AS resultado;

