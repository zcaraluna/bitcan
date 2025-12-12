#!/bin/bash
# Comando corregido para verificar certificados de módulo en el VPS
# Usa el nombre correcto de la base de datos: bitcanc_usuarios

# Opción 1: Usar mariadb (recomendado)
mariadb -u root -p -e "USE bitcanc_usuarios; SELECT id, certificate_number, certificate_type, JSON_EXTRACT(certificate_data, '$.requires_rating') as requires_rating, JSON_EXTRACT(certificate_data, '$.module_name') as module_name, JSON_EXTRACT(certificate_data, '$.module_hours') as module_hours, JSON_EXTRACT(certificate_data, '$.module_start_date') as module_start_date, JSON_EXTRACT(certificate_data, '$.module_completion_date') as module_completion_date, JSON_EXTRACT(certificate_data, '$.module_custom_signature') as module_custom_signature, is_received, created_at FROM certificates WHERE certificate_type IN ('module_completion', 'module') ORDER BY created_at DESC LIMIT 10;"

# Opción 2: Si prefieres usar mysql (aunque está deprecado)
# mysql -u root -p -e "USE bitcanc_usuarios; SELECT id, certificate_number, certificate_type, JSON_EXTRACT(certificate_data, '$.requires_rating') as requires_rating, JSON_EXTRACT(certificate_data, '$.module_name') as module_name, is_received, created_at FROM certificates WHERE certificate_type IN ('module_completion', 'module') ORDER BY created_at DESC LIMIT 10;"

