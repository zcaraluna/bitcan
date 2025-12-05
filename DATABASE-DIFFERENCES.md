# Diferencias entre Base de Datos Local y VPS

## Resumen General

- **Local**: 41 tablas, 1,553 filas
- **VPS**: 40 tablas, 1,253 filas
- **Diferencia**: 1 tabla faltante, 6 columnas faltantes en `courses`, 2 columnas faltantes en `users`

## Tabla `courses` - Columnas Faltantes en VPS

**Local tiene 45 columnas, VPS tiene 39 columnas**

Columnas que faltan en VPS:
1. ✅ `price_pyg` - **Ya tiene migración creada** (`add_price_pyg_field.sql`)
2. `payment_ruc` - Falta crear migración
3. Y 4 columnas más (verificar con comparación completa)

## Tabla `users` - Columnas Faltantes en VPS

**Local tiene 32 columnas, VPS tiene 30 columnas**

Columnas que faltan en VPS:
1. `codigo_postal` - Falta crear migración
2. `nivel_educativo` - Falta crear migración

## Tablas Faltantes en VPS

**Local tiene 41 tablas, VPS tiene 40 tablas**

1 tabla faltante (identificar con comparación completa)

## Acciones Requeridas

1. ✅ Crear migración para `price_pyg` - **COMPLETADO**
2. ⏳ Crear migración para `payment_ruc` en `courses`
3. ⏳ Crear migración para `codigo_postal` en `users`
4. ⏳ Crear migración para `nivel_educativo` en `users`
5. ⏳ Identificar y crear migración para las otras 4 columnas faltantes en `courses`
6. ⏳ Identificar la tabla faltante y crear migración si es necesaria

## Próximos Pasos

1. Copiar `database-structure-local.json` del VPS como `database-structure-vps.json`
2. Ejecutar `node scripts/compare-databases.js` para obtener comparación detallada
3. Crear migraciones para todas las diferencias identificadas


