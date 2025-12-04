-- Agregar campos de perfil adicionales a la tabla users

-- Verificar y agregar campo 'codigo_postal'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'codigo_postal') = 0,
  'ALTER TABLE users ADD COLUMN codigo_postal VARCHAR(20) DEFAULT NULL COMMENT ''Código postal'' AFTER direccion',
  'SELECT "Column codigo_postal already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'nivel_educativo'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'nivel_educativo') = 0,
  'ALTER TABLE users ADD COLUMN nivel_educativo VARCHAR(50) DEFAULT NULL COMMENT ''Nivel educativo'' AFTER empresa',
  'SELECT "Column nivel_educativo already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mensaje de confirmación
SELECT 'Migración de campos de perfil adicionales completada exitosamente' AS resultado;

