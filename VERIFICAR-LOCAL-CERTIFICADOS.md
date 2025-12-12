# 🔍 Verificar Certificados de Módulo en Local

## Cómo Ver los Logs en Local

### Opción 1: Consola de Next.js (Terminal donde corre `npm run dev`)

Los logs aparecerán directamente en la terminal donde ejecutaste:
```bash
npm run dev
```

Deberías ver logs como:
```
🔒🔒🔒 MODO MÓDULO ACTIVADO 🔒🔒🔒
🎯 Tipo de certificado esperado: module_completion
💾 Insertando certificado tipo: module_completion
```

### Opción 2: Consola del Navegador (F12)

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Console**
3. Genera un certificado de módulo
4. Revisa si hay errores o logs

### Opción 3: Pestaña Network (F12 → Network)

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Network**
3. Genera un certificado de módulo
4. Busca la llamada a `/api/admin/certificates`
5. Haz clic en ella y revisa:
   - **Request Payload**: Verifica que `action: "generate_module_certificates"`
   - **Response**: Verifica qué devuelve el servidor

## Verificar en la Base de Datos Local

### Ver los últimos certificados generados

```sql
SELECT 
  id, 
  user_id, 
  course_id, 
  certificate_type, 
  certificate_number, 
  created_at,
  JSON_EXTRACT(certificate_data, '$.module_name') as module_name
FROM certificates 
ORDER BY created_at DESC 
LIMIT 10;
```

### Verificar si se generaron ambos tipos para el mismo estudiante

```sql
SELECT 
  user_id,
  course_id,
  certificate_type,
  COUNT(*) as cantidad,
  GROUP_CONCAT(certificate_number ORDER BY created_at SEPARATOR ', ') as numeros
FROM certificates
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)  -- Última hora
GROUP BY user_id, course_id, certificate_type
HAVING cantidad > 0
ORDER BY user_id, course_id, created_at DESC;
```

## Qué Buscar en los Logs

### ✅ Comportamiento Correcto

Cuando generas un certificado de módulo, deberías ver:

```
═══════════════════════════════════════════════════════════
📥 REQUEST RECIBIDO - Generación de Certificados
═══════════════════════════════════════════════════════════
🎯 Acción recibida: "generate_module_certificates"
🔒🔒🔒 MODO MÓDULO ACTIVADO 🔒🔒🔒
   ⚠️  Solo se generarán certificados de módulo.
   🚫 Certificados de curso están BLOQUEADOS.
🎯 Tipo de certificado esperado: module_completion (acción: generate_module_certificates)
🔄 Procesando X estudiantes para generate_module_certificates
✅ Estudiante X: Generando SOLO certificado de módulo (tipo: module_completion). NO se generará certificado de curso.
💾 Insertando certificado tipo: module_completion para estudiante X (acción: generate_module_certificates)
   ✅ Confirmación: Insertando SOLO certificado de módulo. Tipo: module_completion
✅ Certificado generado correctamente: [número] tipo: module_completion
```

### ❌ Problema Detectado

Si ves:
- Dos requests diferentes (uno con `generate_module_certificates` y otro con `generate_certificates`)
- Un solo request pero el tipo es `course_completion` cuando debería ser `module_completion`
- Errores de "BLOQUEO" o "ERROR CRÍTICO"

## Pasos para Diagnosticar

1. **Abre la consola del navegador** (F12 → Console)
2. **Abre la pestaña Network** (F12 → Network)
3. **Genera un certificado de módulo**
4. **Revisa en Network**:
   - ¿Cuántas llamadas a `/api/admin/certificates` se hicieron?
   - ¿Qué `action` tiene cada llamada?
5. **Revisa en la consola del servidor** (terminal donde corre `npm run dev`):
   - ¿Qué logs aparecen?
   - ¿Hay algún error?
6. **Verifica en la base de datos**:
   - ¿Se generaron ambos tipos de certificados?
   - ¿Cuándo se generaron (mismo timestamp)?

## Si Encuentras el Problema

Comparte:
1. Los logs de la consola del servidor (terminal)
2. La información de la pestaña Network (Request Payload y Response)
3. El resultado de la consulta SQL de verificación

Esto me ayudará a identificar exactamente dónde está el problema.



