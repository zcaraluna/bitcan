-- Agregar campo price_pyg a la tabla courses

-- Verificar y agregar campo 'price_pyg'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'courses' 
   AND COLUMN_NAME = 'price_pyg') = 0,
  'ALTER TABLE courses ADD COLUMN price_pyg DECIMAL(10,2) DEFAULT NULL COMMENT ''Precio en guaraníes paraguayos'' AFTER price',
  'SELECT "Column price_pyg already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mensaje de confirmación
SELECT 'Migración de campo price_pyg completada exitosamente' AS resultado;

