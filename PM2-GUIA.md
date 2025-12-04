# 🚀 Guía de PM2 para BITCAN

## 📦 Instalación de PM2

### Instalar globalmente
```bash
npm install -g pm2
```

### Verificar instalación
```bash
pm2 --version
```

---

## 🎯 Configuración Inicial

### Opción 1: Script Automático (Recomendado)

**Linux/macOS:**
```bash
chmod +x scripts/pm2-setup.sh
./scripts/pm2-setup.sh
```

**Windows (PowerShell):**
```powershell
.\scripts\pm2-setup.ps1
```

### Opción 2: Manual

1. **Build de producción:**
```bash
npm run build
```

2. **Iniciar con PM2:**
```bash
pm2 start ecosystem.config.js
```

3. **Guardar configuración:**
```bash
pm2 save
```

4. **Configurar inicio automático:**
```bash
pm2 startup
# Ejecutar el comando que PM2 muestra
```

---

## 📋 Comandos Principales

### Usando npm scripts (Recomendado)

```bash
# Iniciar aplicación
npm run pm2:start

# Ver estado
npm run pm2:status

# Ver logs en tiempo real
npm run pm2:logs

# Reiniciar aplicación
npm run pm2:restart

# Detener aplicación
npm run pm2:stop

# Eliminar de PM2
npm run pm2:delete

# Guardar configuración
npm run pm2:save

# Deploy completo (build + restart)
npm run deploy
```

### Usando PM2 directamente

```bash
# Iniciar
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs
pm2 logs bitcan

# Reiniciar
pm2 restart bitcan

# Detener
pm2 stop bitcan

# Eliminar
pm2 delete bitcan

# Ver información detallada
pm2 show bitcan

# Monitoreo en tiempo real
pm2 monit

# Guardar configuración actual
pm2 save

# Recargar configuración guardada
pm2 resurrect
```

---

## 🔍 Monitoreo y Logs

### Ver logs en tiempo real
```bash
npm run pm2:logs
# o
pm2 logs bitcan
```

### Ver solo errores
```bash
pm2 logs bitcan --err
```

### Ver solo salida estándar
```bash
pm2 logs bitcan --out
```

### Limpiar logs
```bash
pm2 flush
```

### Monitoreo interactivo
```bash
pm2 monit
```

### Información detallada
```bash
pm2 show bitcan
```

---

## 🔄 Actualización y Deploy

### Deploy completo (Recomendado)
```bash
npm run deploy
```

Este comando:
1. Hace build de producción (`npm run build`)
2. Reinicia la aplicación con PM2 (`pm2 restart bitcan`)

### Deploy manual paso a paso

1. **Hacer build:**
```bash
npm run build
```

2. **Reiniciar aplicación:**
```bash
npm run pm2:restart
```

3. **Verificar que funciona:**
```bash
npm run pm2:status
npm run pm2:logs
```

---

## ⚙️ Configuración (ecosystem.config.js)

El archivo `ecosystem.config.js` contiene la configuración de PM2:

```javascript
{
  name: 'bitcan',              // Nombre de la aplicación
  script: 'npm',               // Script a ejecutar
  args: 'start',               // Argumentos (npm start)
  instances: 1,                 // Número de instancias
  exec_mode: 'fork',            // Modo de ejecución
  max_memory_restart: '1G',    // Reiniciar si usa más de 1GB
  autorestart: true,           // Reiniciar automáticamente
  watch: false,                // No observar cambios (producción)
}
```

### Ajustar memoria máxima

Si necesitas más memoria, edita `ecosystem.config.js`:
```javascript
max_memory_restart: '2G',  // Cambiar a 2GB
```

### Múltiples instancias (Cluster mode)

Para usar múltiples instancias:
```javascript
instances: 2,              // 2 instancias
exec_mode: 'cluster',     // Modo cluster
```

---

## 🛠️ Troubleshooting

### La aplicación no inicia

1. **Verificar logs:**
```bash
pm2 logs bitcan --err
```

2. **Verificar que el build fue exitoso:**
```bash
npm run build
```

3. **Verificar variables de entorno:**
```bash
# Asegúrate de que .env.local o .env.production existe
cat .env.local
```

### La aplicación se reinicia constantemente

1. **Ver logs para encontrar el error:**
```bash
pm2 logs bitcan
```

2. **Verificar uso de memoria:**
```bash
pm2 monit
```

3. **Aumentar límite de memoria si es necesario:**
Editar `ecosystem.config.js` y aumentar `max_memory_restart`

### PM2 no inicia al arrancar el servidor

1. **Reconfigurar startup:**
```bash
pm2 unstartup
pm2 startup
# Ejecutar el comando que muestra
pm2 save
```

### Ver todos los procesos PM2
```bash
pm2 list
```

### Eliminar todos los procesos
```bash
pm2 delete all
```

---

## 📊 Estadísticas y Performance

### Ver estadísticas en tiempo real
```bash
pm2 monit
```

### Ver información de CPU y memoria
```bash
pm2 show bitcan
```

### Reiniciar con límite de memoria
Si la app usa mucha memoria, PM2 la reiniciará automáticamente según `max_memory_restart`.

---

## 🔐 Seguridad

### Variables de entorno

PM2 usa las variables de entorno del sistema. Para producción:

1. **Crear archivo `.env.production`:**
```env
DB_HOST=64.176.18.16
DB_PORT=3306
DB_NAME=bitcanc_usuarios
DB_USER=bitcanc_s1mple
DB_PASSWORD=tu-password
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu-secret-seguro
NODE_ENV=production
```

2. **Cargar variables antes de iniciar PM2:**
```bash
# Linux/macOS
export $(cat .env.production | xargs)
pm2 start ecosystem.config.js

# O usar dotenv-cli
npm install -g dotenv-cli
dotenv -e .env.production -- pm2 start ecosystem.config.js
```

---

## 📝 Logs

Los logs se guardan en:
- `./logs/pm2-error.log` - Errores
- `./logs/pm2-out.log` - Salida estándar
- `./logs/pm2-combined.log` - Logs combinados

### Rotación de logs

PM2 puede rotar logs automáticamente. Instalar:
```bash
pm2 install pm2-logrotate
```

---

## 🚀 Inicio Automático

### Configurar para que inicie al arrancar el servidor

1. **Generar script de startup:**
```bash
pm2 startup
```

2. **Ejecutar el comando que muestra PM2** (requiere sudo en Linux)

3. **Guardar configuración actual:**
```bash
pm2 save
```

Ahora PM2 iniciará automáticamente la aplicación cuando el servidor se reinicie.

---

## 📞 Comandos Rápidos de Referencia

```bash
# Inicio rápido
npm run build && npm run pm2:start && npm run pm2:save

# Deploy
npm run deploy

# Ver estado
npm run pm2:status

# Ver logs
npm run pm2:logs

# Reiniciar
npm run pm2:restart

# Detener
npm run pm2:stop
```

---

## ✅ Checklist de Producción

- [ ] PM2 instalado globalmente
- [ ] Build de producción exitoso (`npm run build`)
- [ ] Variables de entorno configuradas (`.env.production`)
- [ ] Aplicación iniciada con PM2 (`npm run pm2:start`)
- [ ] Configuración guardada (`npm run pm2:save`)
- [ ] Inicio automático configurado (`pm2 startup`)
- [ ] Logs funcionando correctamente
- [ ] Aplicación accesible en el puerto configurado
- [ ] Monitoreo configurado (opcional)

---

*Última actualización: Enero 2025*

