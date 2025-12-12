# 📋 Ver Logs de PM2 en Tiempo Real

## Comandos Principales

### Ver todos los logs en tiempo real
```bash
pm2 logs
```

### Ver logs de una aplicación específica
```bash
pm2 logs bitcan
```

### Ver solo los últimos N líneas y seguir
```bash
pm2 logs --lines 100
```

### Ver solo errores
```bash
pm2 logs --err
```

### Ver solo salida estándar
```bash
pm2 logs --out
```

### Ver logs con colores (por defecto)
```bash
pm2 logs --raw
```

## Ver Logs desde Archivos

Si prefieres ver los logs directamente desde los archivos:

### Logs de error
```bash
tail -f logs/pm2-error.log
```

### Logs de salida
```bash
tail -f logs/pm2-out.log
```

### Logs combinados
```bash
tail -f logs/pm2-combined.log
```

### Ver múltiples archivos a la vez
```bash
tail -f logs/pm2-error.log logs/pm2-out.log
```

## Filtrar Logs

### Buscar errores específicos
```bash
pm2 logs | grep -i "error"
```

### Buscar por texto específico
```bash
pm2 logs | grep "certificate"
```

### Ver logs y filtrar al mismo tiempo
```bash
pm2 logs bitcan | grep -i "puppeteer"
```

## Limpiar Logs

### Limpiar todos los logs de PM2
```bash
pm2 flush
```

### Limpiar logs de una aplicación específica
```bash
pm2 flush bitcan
```

## Ver Estado de la Aplicación

### Ver información de la aplicación
```bash
pm2 show bitcan
```

### Ver monitoreo en tiempo real
```bash
pm2 monit
```

## Salir de los Logs

Presiona `Ctrl + C` para salir de la vista de logs en tiempo real.

