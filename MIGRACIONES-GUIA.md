# 🗄️ Guía de Migraciones de Base de Datos - BITCAN

## 📋 Situación Actual

Tienes una **copia exacta** de la base de datos en el VPS, pero **ninguna migración se ha realizado**. Esta guía te ayudará a aplicar las migraciones de forma segura.

---

## 🎯 Migraciones Disponibles

### 1. **add_profile_fields.sql**
- **Descripción**: Agrega campos de perfil a la tabla `users`
- **Campos agregados**: nombres, apellidos, tipo_documento, numero_documento, fecha_nacimiento, genero, telefono, pais, departamento, ciudad, barrio, direccion, ocupacion, empresa, profile_completed
- **Impacto**: Bajo (solo agrega columnas NULL)

### 2. **add_crypto_payment_fields.sql**
- **Descripción**: Agrega campos para pagos con criptomonedas a la tabla `courses`
- **Campos agregados**: payment_crypto_wallet, payment_crypto_network, payment_crypto_currency
- **Impacto**: Bajo (solo agrega columnas NULL)

### 3. **certificates_v2_migration.sql**
- **Descripción**: Migración completa del sistema de certificados V2
- **Cambios**:
  - Agrega columnas a `certificates`: metadata, revoked_by, revoked_at, revoke_reason, expiry_date
  - Crea tabla `certificate_templates`
  - Crea tabla `certificate_logs`
  - Crea vista `v_certificates_full`
  - Crea triggers para logs automáticos
  - Crea índices para mejor rendimiento
- **Impacto**: Medio (crea nuevas tablas y modifica existentes)

### 4. **update_module_template_custom_message.sql**
- **Descripción**: Actualiza plantillas de módulo para incluir mensaje personalizado
- **Impacto**: Bajo (solo actualiza datos)

---

## ✅ Plan de Migración Seguro

### Paso 1: Verificar Estado Actual

Antes de aplicar migraciones, verifica qué ya está aplicado:

```bash
node scripts/check-migrations.js
```

Este script verifica:
- Qué columnas/tablas existen
- Estado de cada migración
- Migraciones registradas en `schema_migrations`

### Paso 2: Backup de la Base de Datos

**⚠️ CRÍTICO: Haz backup antes de migrar**

```bash
# Desde tu máquina local
mysqldump -h 64.176.18.16 -P 3306 -u bitcanc_s1mple -p bitcanc_usuarios > backup_antes_migracion_$(date +%Y%m%d_%H%M%S).sql

# O desde el VPS directamente
mysqldump -u bitcanc_s1mple -p bitcanc_usuarios > backup_antes_migracion_$(date +%Y%m%d_%H%M%S).sql
```

### Paso 3: Verificar Migraciones (Dry Run)

Ejecuta en modo "dry-run" para ver qué se aplicará sin hacer cambios:

```bash
node scripts/run-migrations.js --dry-run
```

Esto mostrará:
- Qué migraciones están pendientes
- Qué migraciones ya están aplicadas
- No hará ningún cambio en la base de datos

### Paso 4: Aplicar Migraciones

Una vez verificado, aplica las migraciones:

```bash
node scripts/run-migrations.js
```

El script:
1. ✅ Verifica conexión a la base de datos
2. ✅ Crea tabla de seguimiento `schema_migrations`
3. ✅ Verifica estado de cada migración
4. ✅ Aplica solo migraciones pendientes
5. ✅ Registra cada migración aplicada
6. ✅ Maneja errores de forma segura

### Paso 5: Verificar Resultado

Después de aplicar, verifica que todo esté correcto:

```bash
# Verificar estado
node scripts/check-migrations.js

# Verificar en MySQL directamente
mysql -h 64.176.18.16 -P 3306 -u bitcanc_s1mple -p bitcanc_usuarios
```

```sql
-- Ver migraciones aplicadas
SELECT * FROM schema_migrations ORDER BY applied_at;

-- Verificar columnas agregadas
DESCRIBE users;
DESCRIBE courses;
DESCRIBE certificates;

-- Verificar nuevas tablas
SHOW TABLES LIKE 'certificate%';
```

---

## 🔄 Proceso Completo (Resumen)

```bash
# 1. Backup
mysqldump -h 64.176.18.16 -P 3306 -u bitcanc_s1mple -p bitcanc_usuarios > backup.sql

# 2. Verificar estado
node scripts/check-migrations.js

# 3. Dry run
node scripts/run-migrations.js --dry-run

# 4. Aplicar migraciones
node scripts/run-migrations.js

# 5. Verificar resultado
node scripts/check-migrations.js
```

---

## 🛡️ Seguridad de las Migraciones

### Características de Seguridad

1. **Idempotencia**: Las migraciones verifican si ya están aplicadas antes de ejecutarse
2. **Transacciones**: Cada migración se ejecuta de forma atómica
3. **Seguimiento**: Todas las migraciones se registran en `schema_migrations`
4. **Verificación**: Scripts de verificación independientes
5. **Rollback**: Las migraciones incluyen comentarios de rollback

### Verificaciones Automáticas

Las migraciones SQL incluyen verificaciones:
- `IF NOT EXISTS` para columnas
- `IF EXISTS` para tablas
- Verificación de índices antes de crearlos

---

## 🚨 Troubleshooting

### Error: "Column already exists"

**Causa**: La migración ya fue aplicada parcialmente.

**Solución**: 
```bash
# Verificar estado
node scripts/check-migrations.js

# Si la columna existe pero no está registrada, marcarla manualmente:
mysql -h 64.176.18.16 -P 3306 -u bitcanc_s1mple -p bitcanc_usuarios
```

```sql
INSERT INTO schema_migrations (migration_name) VALUES ('nombre_migracion');
```

### Error: "Table doesn't exist"

**Causa**: Falta una tabla base requerida.

**Solución**: Verifica que las tablas principales existan:
```sql
SHOW TABLES;
-- Debe incluir: users, courses, certificates, etc.
```

### Error de Conexión

**Causa**: Problemas de conectividad o credenciales.

**Solución**:
1. Verificar `.env.local` tiene las credenciales correctas
2. Verificar que el VPS acepta conexiones remotas
3. Ver `CONEXION-VPS.md` para más detalles

### Rollback Manual

Si necesitas revertir una migración:

```sql
-- Ver migraciones aplicadas
SELECT * FROM schema_migrations;

-- Eliminar registro (NO elimina los cambios)
DELETE FROM schema_migrations WHERE migration_name = 'nombre_migracion';

-- Luego revertir cambios manualmente según los comentarios en cada migración
```

**⚠️ Nota**: Las migraciones no incluyen rollback automático. Si necesitas revertir, hazlo manualmente o restaura desde backup.

---

## 📊 Tabla de Seguimiento

El script crea automáticamente la tabla `schema_migrations`:

```sql
CREATE TABLE schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_by VARCHAR(255) NULL
);
```

Esta tabla registra:
- Nombre de cada migración aplicada
- Fecha/hora de aplicación
- Usuario que ejecutó la migración

---

## ✅ Checklist Pre-Migración

- [ ] Backup de base de datos creado
- [ ] Variables de entorno configuradas (`.env.local`)
- [ ] Conexión a base de datos verificada
- [ ] Estado actual verificado (`check-migrations.js`)
- [ ] Dry-run ejecutado sin errores
- [ ] Ventana de mantenimiento programada (si es producción)
- [ ] Notificación a usuarios (si es necesario)

---

## ✅ Checklist Post-Migración

- [ ] Todas las migraciones aplicadas exitosamente
- [ ] Estado verificado (`check-migrations.js`)
- [ ] Tablas/columnas verificadas en MySQL
- [ ] Aplicación Next.js funciona correctamente
- [ ] No hay errores en logs
- [ ] Backup guardado en lugar seguro

---

## 🎯 Orden de Ejecución

Las migraciones se aplican en este orden:

1. **add_profile_fields** (campos de usuario)
2. **add_crypto_payment_fields** (campos de pago)
3. **certificates_v2_migration** (sistema de certificados completo)
4. **update_module_template_custom_message** (actualización de plantillas)

Este orden es importante porque algunas migraciones dependen de otras.

---

## 📞 Comandos Rápidos

```bash
# Ver estado
node scripts/check-migrations.js

# Dry run
node scripts/run-migrations.js --dry-run

# Aplicar migraciones
node scripts/run-migrations.js

# Backup rápido
mysqldump -h 64.176.18.16 -P 3306 -u bitcanc_s1mple -p bitcanc_usuarios > backup.sql
```

---

## 🔐 Recomendaciones para Producción

1. **Hacer backup completo** antes de migrar
2. **Ejecutar en horario de bajo tráfico**
3. **Probar primero en base de datos de desarrollo/staging**
4. **Monitorear logs durante la migración**
5. **Tener plan de rollback listo**
6. **Comunicar a usuarios si hay mantenimiento**

---

*Última actualización: Enero 2025*

