-- Crear tabla exchange_rates si no existe

CREATE TABLE IF NOT EXISTS exchange_rates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  currency_code VARCHAR(3) NOT NULL UNIQUE COMMENT 'Código de moneda (USD, ARS, BRL)',
  currency_name VARCHAR(50) NOT NULL COMMENT 'Nombre de la moneda',
  rate_to_pyg DECIMAL(10,2) NOT NULL COMMENT 'Tasa de cambio a guaraníes',
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_currency_code (currency_code),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mensaje de confirmación
SELECT 'Migración de tabla exchange_rates completada exitosamente' AS resultado;

