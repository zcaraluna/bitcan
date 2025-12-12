#!/bin/bash
# Script para verificar requires_rating en certificados de módulo en el VPS
# Uso: ./scripts/verificar-requires-rating-vps.sh

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Verificación de requires_rating en certificados de módulo ===${NC}\n"

# Verificar si se proporcionó la base de datos como argumento
DB_NAME="${1:-bitcan}"

echo -e "${YELLOW}Usando base de datos: ${DB_NAME}${NC}\n"

# Ejecutar consultas SQL
mysql -u root -p "${DB_NAME}" <<EOF

-- 1. Verificar estructura de la tabla
echo -e "${GREEN}1. Estructura de la tabla certificates:${NC}"
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    IS_NULLABLE
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_SCHEMA = '${DB_NAME}'
    AND TABLE_NAME = 'certificates'
    AND COLUMN_NAME IN ('certificate_type', 'certificate_data', 'metadata')
ORDER BY 
    ORDINAL_POSITION;

-- 2. Verificar certificados de módulo recientes
echo -e "\n${GREEN}2. Certificados de módulo recientes (últimos 10):${NC}"
SELECT 
    id,
    certificate_number,
    certificate_type,
    JSON_EXTRACT(certificate_data, '$.requires_rating') as requires_rating,
    JSON_EXTRACT(certificate_data, '$.module_name') as module_name,
    is_received,
    created_at
FROM 
    certificates
WHERE 
    certificate_type IN ('module_completion', 'module')
ORDER BY 
    created_at DESC
LIMIT 10;

-- 3. Estadísticas de requires_rating
echo -e "\n${GREEN}3. Estadísticas de requires_rating:${NC}"
SELECT 
    certificate_type,
    JSON_EXTRACT(certificate_data, '$.requires_rating') as requires_rating_value,
    COUNT(*) as total,
    SUM(CASE WHEN is_received = 1 THEN 1 ELSE 0 END) as recibidos,
    SUM(CASE WHEN is_received = 0 THEN 1 ELSE 0 END) as no_recibidos
FROM 
    certificates
WHERE 
    certificate_type IN ('module_completion', 'module')
GROUP BY 
    certificate_type,
    JSON_EXTRACT(certificate_data, '$.requires_rating')
ORDER BY 
    certificate_type,
    requires_rating_value;

EOF

echo -e "\n${GREEN}=== Verificación completada ===${NC}"

