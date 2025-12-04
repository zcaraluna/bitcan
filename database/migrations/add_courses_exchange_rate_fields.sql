-- Agregar campos de tasas de cambio y RUC a la tabla courses

-- Verificar y agregar campo 'exchange_rate_usd'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'courses' 
   AND COLUMN_NAME = 'exchange_rate_usd') = 0,
  'ALTER TABLE courses ADD COLUMN exchange_rate_usd DECIMAL(10,2) DEFAULT NULL COMMENT ''Tasa de cambio USD a PYG'' AFTER price_pyg',
  'SELECT "Column exchange_rate_usd already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'exchange_rate_ars'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'courses' 
   AND COLUMN_NAME = 'exchange_rate_ars') = 0,
  'ALTER TABLE courses ADD COLUMN exchange_rate_ars DECIMAL(10,2) DEFAULT NULL COMMENT ''Tasa de cambio ARS a PYG'' AFTER exchange_rate_usd',
  'SELECT "Column exchange_rate_ars already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'exchange_rate_brl'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'courses' 
   AND COLUMN_NAME = 'exchange_rate_brl') = 0,
  'ALTER TABLE courses ADD COLUMN exchange_rate_brl DECIMAL(10,2) DEFAULT NULL COMMENT ''Tasa de cambio BRL a PYG'' AFTER exchange_rate_ars',
  'SELECT "Column exchange_rate_brl already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'rates_snapshot_at'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'courses' 
   AND COLUMN_NAME = 'rates_snapshot_at') = 0,
  'ALTER TABLE courses ADD COLUMN rates_snapshot_at TIMESTAMP NULL DEFAULT NULL COMMENT ''Fecha/hora de la captura de tasas'' AFTER exchange_rate_brl',
  'SELECT "Column rates_snapshot_at already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'payment_ruc'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'courses' 
   AND COLUMN_NAME = 'payment_ruc') = 0,
  'ALTER TABLE courses ADD COLUMN payment_ruc VARCHAR(20) DEFAULT NULL COMMENT ''RUC para pagos'' AFTER payment_whatsapp',
  'SELECT "Column payment_ruc already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mensaje de confirmación
SELECT 'Migración de campos de tasas de cambio y RUC completada exitosamente' AS resultado;

