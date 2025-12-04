-- ========================================
-- MIGRACIÓN SISTEMA DE CERTIFICADOS V2
-- Arquitectura moderna con Puppeteer
-- ========================================

-- Crear backup de la tabla antigua
CREATE TABLE IF NOT EXISTS certificates_backup AS SELECT * FROM certificates;

-- Modificar tabla de certificados existente
-- Agregar columnas si no existen
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificates' 
   AND COLUMN_NAME = 'metadata') = 0,
  'ALTER TABLE certificates ADD COLUMN metadata JSON COMMENT ''Metadata completa del certificado''',
  'SELECT ''Column metadata already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificates' 
   AND COLUMN_NAME = 'revoked_by') = 0,
  'ALTER TABLE certificates ADD COLUMN revoked_by INT NULL COMMENT ''Usuario que revocó el certificado''',
  'SELECT ''Column revoked_by already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificates' 
   AND COLUMN_NAME = 'revoked_at') = 0,
  'ALTER TABLE certificates ADD COLUMN revoked_at DATETIME NULL COMMENT ''Fecha de revocación''',
  'SELECT ''Column revoked_at already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificates' 
   AND COLUMN_NAME = 'revoke_reason') = 0,
  'ALTER TABLE certificates ADD COLUMN revoke_reason TEXT NULL COMMENT ''Razón de revocación''',
  'SELECT ''Column revoke_reason already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificates' 
   AND COLUMN_NAME = 'expiry_date') = 0,
  'ALTER TABLE certificates ADD COLUMN expiry_date DATE NULL COMMENT ''Fecha de expiración''',
  'SELECT ''Column expiry_date already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Cambiar temporalmente a VARCHAR para poder actualizar valores
ALTER TABLE certificates 
  MODIFY COLUMN certificate_type VARCHAR(50);

-- Mapear valores antiguos a nuevos valores
UPDATE certificates 
SET certificate_type = 'course_completion' 
WHERE certificate_type = 'course' OR certificate_type IS NULL OR certificate_type = '';

UPDATE certificates 
SET certificate_type = 'module_completion' 
WHERE certificate_type = 'module';

-- Convertir cualquier otro valor inválido a 'course_completion'
UPDATE certificates 
SET certificate_type = 'course_completion' 
WHERE certificate_type NOT IN ('course_completion', 'module_completion', 'achievement', 'participation');

-- Ahora cambiar a ENUM con los nuevos valores
ALTER TABLE certificates 
  MODIFY COLUMN certificate_type ENUM('course_completion', 'module_completion', 'achievement', 'participation') DEFAULT 'course_completion',
  MODIFY COLUMN status ENUM('draft', 'issued', 'revoked', 'expired') DEFAULT 'draft';

-- Índices para mejor rendimiento (solo si no existen)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificates' 
   AND INDEX_NAME = 'idx_cert_number') = 0,
  'CREATE INDEX idx_cert_number ON certificates(certificate_number)',
  'SELECT ''Index idx_cert_number already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificates' 
   AND INDEX_NAME = 'idx_cert_user') = 0,
  'CREATE INDEX idx_cert_user ON certificates(user_id)',
  'SELECT ''Index idx_cert_user already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificates' 
   AND INDEX_NAME = 'idx_cert_course') = 0,
  'CREATE INDEX idx_cert_course ON certificates(course_id)',
  'SELECT ''Index idx_cert_course already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificates' 
   AND INDEX_NAME = 'idx_cert_status') = 0,
  'CREATE INDEX idx_cert_status ON certificates(status)',
  'SELECT ''Index idx_cert_status already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificates' 
   AND INDEX_NAME = 'idx_cert_type') = 0,
  'CREATE INDEX idx_cert_type ON certificates(certificate_type)',
  'SELECT ''Index idx_cert_type already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificates' 
   AND INDEX_NAME = 'idx_cert_issue_date') = 0,
  'CREATE INDEX idx_cert_issue_date ON certificates(issue_date)',
  'SELECT ''Index idx_cert_issue_date already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Tabla de plantillas (si no existe)
CREATE TABLE IF NOT EXISTS certificate_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT 'Nombre de la plantilla',
  description TEXT NULL COMMENT 'Descripción de la plantilla',
  template_type ENUM('modern', 'classic', 'minimal', 'corporate', 'custom') DEFAULT 'custom',
  html_content TEXT NOT NULL COMMENT 'Contenido HTML de la plantilla',
  css_styles TEXT NULL COMMENT 'Estilos CSS personalizados',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Si la plantilla está activa',
  is_default BOOLEAN DEFAULT FALSE COMMENT 'Si es la plantilla por defecto',
  preview_image_url VARCHAR(500) NULL COMMENT 'URL de imagen de preview',
  created_by INT NOT NULL COMMENT 'Usuario que creó la plantilla',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_template_active (is_active),
  INDEX idx_template_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar columnas faltantes si la tabla existe pero no tiene todas las columnas
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificate_templates' 
   AND COLUMN_NAME = 'template_type') = 0,
  'ALTER TABLE certificate_templates ADD COLUMN template_type ENUM(''modern'', ''classic'', ''minimal'', ''corporate'', ''custom'') DEFAULT ''custom'' AFTER description',
  'SELECT ''Column template_type already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificate_templates' 
   AND COLUMN_NAME = 'html_content') = 0,
  'ALTER TABLE certificate_templates ADD COLUMN html_content TEXT NOT NULL COMMENT ''Contenido HTML de la plantilla'' AFTER template_type',
  'SELECT ''Column html_content already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificate_templates' 
   AND COLUMN_NAME = 'css_styles') = 0,
  'ALTER TABLE certificate_templates ADD COLUMN css_styles TEXT NULL COMMENT ''Estilos CSS personalizados'' AFTER html_content',
  'SELECT ''Column css_styles already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificate_templates' 
   AND COLUMN_NAME = 'is_active') = 0,
  'ALTER TABLE certificate_templates ADD COLUMN is_active BOOLEAN DEFAULT TRUE COMMENT ''Si la plantilla está activa'' AFTER css_styles',
  'SELECT ''Column is_active already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificate_templates' 
   AND COLUMN_NAME = 'is_default') = 0,
  'ALTER TABLE certificate_templates ADD COLUMN is_default BOOLEAN DEFAULT FALSE COMMENT ''Si es la plantilla por defecto'' AFTER is_active',
  'SELECT ''Column is_default already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificate_templates' 
   AND COLUMN_NAME = 'preview_image_url') = 0,
  'ALTER TABLE certificate_templates ADD COLUMN preview_image_url VARCHAR(500) NULL COMMENT ''URL de imagen de preview'' AFTER is_default',
  'SELECT ''Column preview_image_url already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'certificate_templates' 
   AND COLUMN_NAME = 'created_by') = 0,
  'ALTER TABLE certificate_templates ADD COLUMN created_by INT NOT NULL COMMENT ''Usuario que creó la plantilla'' AFTER preview_image_url',
  'SELECT ''Column created_by already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insertar plantilla por defecto (moderna) solo si no existe
-- Verificar qué columnas tiene la tabla y hacer INSERT condicional
SET @has_template_html = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'certificate_templates' 
  AND COLUMN_NAME = 'template_html');

SET @has_html_content = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'certificate_templates' 
  AND COLUMN_NAME = 'html_content');

SET @template_html_content = '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white;">
  <div style="text-align: center; padding: 40px;">
    <h1 style="font-size: 48px; margin-bottom: 20px; font-weight: bold;">CERTIFICADO</h1>
    <p style="font-size: 24px; margin-bottom: 40px;">Se otorga a</p>
    <h2 style="font-size: 56px; margin-bottom: 40px; font-weight: bold; text-transform: uppercase;">{{student_name}}</h2>
    <p style="font-size: 20px; margin-bottom: 20px;">Por completar exitosamente el curso</p>
    <h3 style="font-size: 32px; margin-bottom: 40px; font-weight: 600;">{{course_title}}</h3>
    <div style="display: flex; justify-content: space-around; max-width: 600px; margin: 0 auto;">
      <div>
        <p style="font-size: 14px; opacity: 0.9;">Duración</p>
        <p style="font-size: 20px; font-weight: bold;">{{duration_hours}} horas</p>
      </div>
      <div>
        <p style="font-size: 14px; opacity: 0.9;">Fecha de emisión</p>
        <p style="font-size: 20px; font-weight: bold;">{{formatDate issue_date}}</p>
      </div>
    </div>
    <p style="font-size: 14px; margin-top: 60px; opacity: 0.8;">Certificado N° {{certificate_number}}</p>
  </div>
</div>';

-- Insertar según qué columnas existen
SET @sql = IF(@has_template_html > 0,
  CONCAT('INSERT INTO certificate_templates (name, description, template_html', 
    IF(@has_html_content > 0, ', html_content', ''),
    IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ''certificate_templates'' AND COLUMN_NAME = ''template_type'') > 0, ', template_type', ''),
    ', is_active, is_default, created_by) SELECT ''Plantilla Moderna'', ''Diseño moderno con gradiente'', ''', @template_html_content, '''',
    IF(@has_html_content > 0, CONCAT(', ''', @template_html_content, ''''), ''),
    IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ''certificate_templates'' AND COLUMN_NAME = ''template_type'') > 0, ', ''modern''', ''),
    ', 1, 1, (SELECT id FROM users WHERE role = ''superadmin'' LIMIT 1) WHERE NOT EXISTS (SELECT 1 FROM certificate_templates WHERE is_default = 1)'),
  CONCAT('INSERT INTO certificate_templates (name, description', 
    IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ''certificate_templates'' AND COLUMN_NAME = ''template_type'') > 0, ', template_type', ''),
    ', html_content, is_active, is_default, created_by) SELECT ''Plantilla Moderna'', ''Diseño moderno con gradiente''',
    IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ''certificate_templates'' AND COLUMN_NAME = ''template_type'') > 0, ', ''modern''', ''),
    ', ''', @template_html_content, ''', 1, 1, (SELECT id FROM users WHERE role = ''superadmin'' LIMIT 1) WHERE NOT EXISTS (SELECT 1 FROM certificate_templates WHERE is_default = 1)')
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrar datos antiguos al nuevo formato
UPDATE certificates 
SET metadata = JSON_OBJECT(
  'html', IFNULL(JSON_UNQUOTE(JSON_EXTRACT(certificate_data, '$.html')), ''),
  'student_name', (SELECT name FROM users WHERE id = certificates.user_id),
  'course_title', (SELECT title FROM courses WHERE id = certificates.course_id),
  'duration_hours', IFNULL((SELECT duration_hours FROM courses WHERE id = certificates.course_id), 0),
  'start_date', IFNULL(issue_date, created_at),
  'completion_date', IFNULL(completion_date, issue_date),
  'instructor_names', (
    SELECT JSON_ARRAYAGG(u.name) 
    FROM course_instructors ci 
    JOIN users u ON ci.instructor_id = u.id 
    WHERE ci.course_id = certificates.course_id
  )
)
WHERE metadata IS NULL;

-- Actualizar estados a nuevo formato
UPDATE certificates SET status = 'issued' WHERE status NOT IN ('draft', 'issued', 'revoked', 'expired');

-- Tabla de logs de certificados (opcional, para auditoría)
CREATE TABLE IF NOT EXISTS certificate_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  certificate_id INT NOT NULL,
  action ENUM('created', 'issued', 'downloaded', 'revoked', 'restored') NOT NULL,
  performed_by INT NOT NULL,
  details TEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_log_certificate (certificate_id),
  INDEX idx_log_action (action),
  INDEX idx_log_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vista para certificados con información completa
CREATE OR REPLACE VIEW v_certificates_full AS
SELECT 
  c.*,
  u.name as student_name,
  u.email as student_email,
  co.title as course_title,
  co.identifier as course_identifier,
  issued.name as issued_by_name,
  revoked.name as revoked_by_name
FROM certificates c
JOIN users u ON c.user_id = u.id
JOIN courses co ON c.course_id = co.id
LEFT JOIN users issued ON c.issued_by = issued.id
LEFT JOIN users revoked ON c.revoked_by = revoked.id;

-- Trigger para logs automáticos (opcional)
DELIMITER //

CREATE TRIGGER IF NOT EXISTS after_certificate_insert
AFTER INSERT ON certificates
FOR EACH ROW
BEGIN
  INSERT INTO certificate_logs (certificate_id, action, performed_by, details)
  VALUES (NEW.id, 'created', NEW.issued_by, 'Certificado creado');
END//

CREATE TRIGGER IF NOT EXISTS after_certificate_revoke
AFTER UPDATE ON certificates
FOR EACH ROW
BEGIN
  IF NEW.status = 'revoked' AND OLD.status != 'revoked' THEN
    INSERT INTO certificate_logs (certificate_id, action, performed_by, details)
    VALUES (NEW.id, 'revoked', NEW.revoked_by, NEW.revoke_reason);
  END IF;
END//

DELIMITER ;

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Verificar estructura
DESCRIBE certificates;
DESCRIBE certificate_templates;
DESCRIBE certificate_logs;

-- Verificar datos migrados
SELECT 
  COUNT(*) as total_certificates,
  COUNT(CASE WHEN metadata IS NOT NULL THEN 1 END) as with_metadata,
  COUNT(CASE WHEN status = 'issued' THEN 1 END) as issued,
  COUNT(CASE WHEN status = 'revoked' THEN 1 END) as revoked
FROM certificates;

-- Verificar plantillas
SELECT id, name, template_type, is_active, is_default FROM certificate_templates;

-- ========================================
-- ROLLBACK (si es necesario)
-- ========================================
-- DROP TABLE IF EXISTS certificates;
-- RENAME TABLE certificates_backup TO certificates;
-- DROP TABLE IF EXISTS certificate_templates;
-- DROP TABLE IF EXISTS certificate_logs;
-- DROP VIEW IF EXISTS v_certificates_full;

