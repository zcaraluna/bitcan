-- Migración para agregar campos de perfil a la tabla users (exactamente como en el legacy PHP)

-- Verificar y agregar campo 'nombres'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'nombres') = 0,
  'ALTER TABLE users ADD COLUMN nombres VARCHAR(100) DEFAULT NULL AFTER name',
  'SELECT "Column nombres already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'apellidos'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'apellidos') = 0,
  'ALTER TABLE users ADD COLUMN apellidos VARCHAR(100) DEFAULT NULL AFTER nombres',
  'SELECT "Column apellidos already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'tipo_documento'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'tipo_documento') = 0,
  'ALTER TABLE users ADD COLUMN tipo_documento VARCHAR(50) DEFAULT NULL AFTER apellidos',
  'SELECT "Column tipo_documento already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'numero_documento'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'numero_documento') = 0,
  'ALTER TABLE users ADD COLUMN numero_documento VARCHAR(50) DEFAULT NULL AFTER tipo_documento',
  'SELECT "Column numero_documento already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'fecha_nacimiento'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'fecha_nacimiento') = 0,
  'ALTER TABLE users ADD COLUMN fecha_nacimiento DATE DEFAULT NULL AFTER numero_documento',
  'SELECT "Column fecha_nacimiento already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'genero'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'genero') = 0,
  'ALTER TABLE users ADD COLUMN genero VARCHAR(50) DEFAULT NULL AFTER fecha_nacimiento',
  'SELECT "Column genero already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'telefono'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'telefono') = 0,
  'ALTER TABLE users ADD COLUMN telefono VARCHAR(20) DEFAULT NULL AFTER genero',
  'SELECT "Column telefono already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'pais'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'pais') = 0,
  'ALTER TABLE users ADD COLUMN pais VARCHAR(100) DEFAULT NULL AFTER telefono',
  'SELECT "Column pais already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'departamento'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'departamento') = 0,
  'ALTER TABLE users ADD COLUMN departamento VARCHAR(100) DEFAULT NULL AFTER pais',
  'SELECT "Column departamento already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'ciudad'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'ciudad') = 0,
  'ALTER TABLE users ADD COLUMN ciudad VARCHAR(100) DEFAULT NULL AFTER departamento',
  'SELECT "Column ciudad already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'barrio'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'barrio') = 0,
  'ALTER TABLE users ADD COLUMN barrio VARCHAR(100) DEFAULT NULL AFTER ciudad',
  'SELECT "Column barrio already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'direccion'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'direccion') = 0,
  'ALTER TABLE users ADD COLUMN direccion VARCHAR(255) DEFAULT NULL AFTER barrio',
  'SELECT "Column direccion already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'ocupacion'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'ocupacion') = 0,
  'ALTER TABLE users ADD COLUMN ocupacion VARCHAR(100) DEFAULT NULL AFTER direccion',
  'SELECT "Column ocupacion already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'empresa'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'empresa') = 0,
  'ALTER TABLE users ADD COLUMN empresa VARCHAR(150) DEFAULT NULL AFTER ocupacion',
  'SELECT "Column empresa already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar campo 'profile_completed'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'users' 
   AND COLUMN_NAME = 'profile_completed') = 0,
  'ALTER TABLE users ADD COLUMN profile_completed TINYINT(1) DEFAULT 0 AFTER empresa',
  'SELECT "Column profile_completed already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mensaje de confirmación
SELECT 'Migración de campos de perfil completada exitosamente' AS resultado;
