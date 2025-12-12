#!/bin/bash
# Script completo para verificar certificados de módulo en el VPS
# Verifica: requires_rating, module_name, module_hours, dates, etc.

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar si se proporcionó la base de datos como argumento
DB_NAME="${1:-bitcan}"

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Verificación Completa de Certificados de Módulo${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Usando base de datos: ${DB_NAME}${NC}\n"

# Ejecutar consultas SQL
mysql -u root -p "${DB_NAME}" <<EOF

-- 1. Certificados de módulo recientes con TODOS los campos
echo -e "${BLUE}1. Certificados de módulo recientes (últimos 10):${NC}"
SELECT 
    id,
    certificate_number,
    certificate_type,
    JSON_EXTRACT(certificate_data, '$.module_name') as module_name,
    JSON_EXTRACT(certificate_data, '$.requires_rating') as requires_rating,
    JSON_EXTRACT(certificate_data, '$.module_hours') as module_hours,
    JSON_EXTRACT(certificate_data, '$.module_start_date') as module_start_date,
    JSON_EXTRACT(certificate_data, '$.module_completion_date') as module_completion_date,
    JSON_EXTRACT(certificate_data, '$.module_custom_signature') as module_custom_signature,
    is_received,
    created_at
FROM 
    certificates
WHERE 
    certificate_type IN ('module_completion', 'module')
ORDER BY 
    created_at DESC
LIMIT 10;

-- 2. Estadísticas de campos
echo -e "\n${BLUE}2. Estadísticas de campos en certificados de módulo:${NC}"
SELECT 
    certificate_type,
    COUNT(*) as total,
    SUM(CASE WHEN JSON_EXTRACT(certificate_data, '$.module_name') IS NOT NULL THEN 1 ELSE 0 END) as con_module_name,
    SUM(CASE WHEN JSON_EXTRACT(certificate_data, '$.requires_rating') = true THEN 1 ELSE 0 END) as requires_rating_true,
    SUM(CASE WHEN JSON_EXTRACT(certificate_data, '$.requires_rating') = false THEN 1 ELSE 0 END) as requires_rating_false,
    SUM(CASE WHEN JSON_EXTRACT(certificate_data, '$.requires_rating') IS NULL THEN 1 ELSE 0 END) as requires_rating_null,
    SUM(CASE WHEN JSON_EXTRACT(certificate_data, '$.module_hours') IS NOT NULL THEN 1 ELSE 0 END) as con_module_hours,
    SUM(CASE WHEN JSON_EXTRACT(certificate_data, '$.module_start_date') IS NOT NULL THEN 1 ELSE 0 END) as con_start_date,
    SUM(CASE WHEN JSON_EXTRACT(certificate_data, '$.module_completion_date') IS NOT NULL THEN 1 ELSE 0 END) as con_completion_date
FROM 
    certificates
WHERE 
    certificate_type IN ('module_completion', 'module')
GROUP BY 
    certificate_type;

-- 3. Verificar JSON válido
echo -e "\n${BLUE}3. Verificación de JSON válido:${NC}"
SELECT 
    id,
    certificate_number,
    CASE 
        WHEN JSON_VALID(certificate_data) THEN '✅ JSON válido'
        ELSE '❌ JSON INVÁLIDO'
    END as json_status,
    LEFT(certificate_data, 150) as preview
FROM 
    certificates
WHERE 
    certificate_type IN ('module_completion', 'module')
ORDER BY 
    created_at DESC
LIMIT 5;

-- 4. Certificados de los últimos 7 días con detalles completos
echo -e "\n${BLUE}4. Certificados de módulo de los últimos 7 días:${NC}"
SELECT 
    c.id,
    c.certificate_number,
    u.name as estudiante,
    JSON_EXTRACT(c.certificate_data, '$.module_name') as module_name,
    JSON_EXTRACT(c.certificate_data, '$.requires_rating') as requires_rating,
    JSON_EXTRACT(c.certificate_data, '$.module_hours') as module_hours,
    c.is_received,
    c.created_at
FROM 
    certificates c
LEFT JOIN 
    users u ON c.user_id = u.id
WHERE 
    c.certificate_type IN ('module_completion', 'module')
    AND c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY 
    c.created_at DESC;

EOF

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Verificación completada${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

