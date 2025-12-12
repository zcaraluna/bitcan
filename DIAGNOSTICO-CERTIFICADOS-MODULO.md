# 🔍 Diagnóstico de Certificados de Módulo

## Problema
Los certificados de módulo muestran mensaje de éxito pero no se generan o no se "envían".

## Cambios Realizados

### 1. **Mapeo de Parámetros Corregido**
El frontend enviaba `module_hours`, `module_start_date`, etc., pero el backend esperaba `manual_hours`, `manual_start_date`, etc. Ahora el backend acepta ambos formatos.

### 2. **Logging Detallado Agregado**
Ahora verás en los logs del servidor:
- ✅ Plantilla encontrada
- 🔄 Procesando X estudiantes
- 📝 Procesando certificado para [nombre]
- ⏭️ Estudiante omitido (ya existe certificado)
- ❌ Errores específicos
- 📊 Resumen final

### 3. **Validación de Certificados Existentes Mejorada**
Ahora verifica correctamente si ya existe un certificado de módulo antes de crear uno nuevo.

### 4. **Manejo de Errores Mejorado**
Los errores ahora se capturan y reportan individualmente por estudiante.

## Cómo Diagnosticar

### Paso 1: Ver los Logs en Tiempo Real

En el VPS, ejecuta:
```bash
pm2 logs bitcan
```

O para ver solo errores:
```bash
pm2 logs bitcan --err
```

### Paso 2: Intentar Generar un Certificado de Módulo

1. Ve a la sección de certificados
2. Selecciona "Certificados de Módulo"
3. Ingresa el nombre del módulo
4. Selecciona un estudiante
5. Haz clic en "Generar"

### Paso 3: Revisar los Logs

Busca en los logs:
- `✅ Plantilla encontrada para acción: generate_module_certificates`
- `🔄 Procesando X estudiantes para generate_module_certificates`
- `📝 Procesando certificado para: [nombre]`
- `✅ Certificado generado: [número] para [nombre]`
- `📊 Resumen: X generados, Y omitidos, Z errores`

### Paso 4: Verificar en la Base de Datos

Si los logs muestran éxito pero no ves el certificado, verifica directamente en la BD:

```sql
-- Ver certificados de módulo recientes
SELECT 
  id, 
  user_id, 
  course_id, 
  certificate_number, 
  certificate_type, 
  status, 
  created_at 
FROM certificates 
WHERE certificate_type = 'module_completion' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Paso 5: Verificar la Plantilla

Si no se encuentra la plantilla, verifica:

```sql
-- Ver plantillas disponibles
SELECT 
  id, 
  name, 
  is_default, 
  is_active, 
  template_type 
FROM certificate_templates;
```

Para certificados de módulo, se busca una plantilla con `is_default = 0` y `is_active = 1`. Si no existe, se usa la plantilla por defecto (`is_default = 1`).

## Posibles Problemas y Soluciones

### Problema 1: "No hay plantilla de certificado disponible"
**Solución:** Crea una plantilla en la tabla `certificate_templates` con `is_active = 1`.

### Problema 2: "Ya existe certificado de tipo module_completion"
**Solución:** Esto es normal. El sistema evita duplicados. Si necesitas regenerar, elimina el certificado existente primero.

### Problema 3: "Estudiante no encontrado"
**Solución:** Verifica que el `student_id` sea válido y que el usuario exista en la tabla `users`.

### Problema 4: Los certificados se generan pero no se "envían"
**Nota:** Actualmente el sistema **NO envía certificados por email automáticamente**. Los certificados se guardan en la base de datos y el estudiante puede descargarlos desde su panel.

Si necesitas enviar certificados por email, necesitarías:
1. Configurar un servicio de email (SMTP)
2. Agregar código para enviar emails después de generar certificados
3. O usar un servicio de terceros (SendGrid, Mailgun, etc.)

## Verificar que los Certificados se Guardaron

```sql
-- Ver el último certificado generado
SELECT 
  c.id,
  c.certificate_number,
  c.certificate_type,
  c.status,
  u.name as student_name,
  co.title as course_title,
  JSON_EXTRACT(c.certificate_data, '$.module_name') as module_name,
  c.created_at
FROM certificates c
JOIN users u ON c.user_id = u.id
JOIN courses co ON c.course_id = co.id
WHERE c.certificate_type = 'module_completion'
ORDER BY c.created_at DESC
LIMIT 5;
```

## Próximos Pasos

Si después de revisar los logs sigues teniendo problemas:

1. **Comparte los logs** del servidor cuando intentas generar un certificado
2. **Verifica la respuesta del API** en la consola del navegador (F12 → Network)
3. **Revisa la base de datos** para ver si los certificados se están guardando

