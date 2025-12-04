# 🚀 Guía de Deployment - BITCAN

## 📋 Prerequisitos

Antes de comenzar, asegúrate de tener en el servidor:

- Node.js 18+ instalado
- npm o yarn instalado
- Git instalado
- PM2 instalado globalmente (`npm install -g pm2`)
- Acceso SSH al servidor
- Puerto 2530 disponible

---

## 🎯 Paso 1: Clonar el Repositorio

### Conectar al servidor

```bash
ssh usuario@tu-servidor.com
```

### Crear directorio y clonar

```bash
# Crear directorio para la aplicación (ajusta según tu preferencia)
cd /var/www  # o /home/usuario, /opt, etc.

# Clonar el repositorio
git clone https://github.com/tu-usuario/bitcan.git
# O si es privado:
# git clone git@github.com:tu-usuario/bitcan.git

# Entrar al directorio
cd bitcan
```

**Nota**: Si el repositorio es privado, asegúrate de tener configuradas las claves SSH en el servidor.

---

## 🔧 Paso 2: Instalar Dependencias

```bash
# Instalar dependencias de Node.js
npm install

# O si prefieres yarn:
# yarn install
```

---

## ⚙️ Paso 3: Configurar Variables de Entorno

### Crear archivo `.env.production`

```bash
# Crear archivo de variables de entorno
nano .env.production
# o
vim .env.production
```

### Contenido del archivo `.env.production`:

```env
# Base de Datos (VPS)
DB_HOST=64.176.18.16
DB_PORT=3306
DB_NAME=bitcanc_usuarios
DB_USER=bitcanc_s1mple
DB_PASSWORD=.Recalde97123

# Next.js
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu-secret-seguro-generado
NODE_ENV=production

# Puerto (opcional, ya está en ecosystem.config.js)
PORT=2530
```

### Generar NEXTAUTH_SECRET seguro

```bash
# Generar secret seguro
openssl rand -base64 32
```

Copia el resultado y úsalo como `NEXTAUTH_SECRET` en `.env.production`.

---

## 🗄️ Paso 4: Aplicar Migraciones de Base de Datos

### Verificar estado de migraciones

```bash
npm run migrations:check
```

### Aplicar migraciones

```bash
# Primero hacer backup
mysqldump -h 64.176.18.16 -P 3306 -u bitcanc_s1mple -p bitcanc_usuarios > backup_antes_migracion.sql

# Ver qué se aplicará (dry-run)
npm run migrations:dry-run

# Aplicar migraciones
npm run migrations:run

# Verificar resultado
npm run migrations:check
```

**Ver `MIGRACIONES-GUIA.md` para más detalles.**

---

## 🔨 Paso 5: Build de Producción

```bash
# Crear build optimizado
npm run build
```

Verifica que el build se complete sin errores. Si hay errores, corrígelos antes de continuar.

---

## 🚀 Paso 6: Configurar PM2

### Iniciar con PM2

```bash
# Iniciar aplicación
npm run pm2:start

# Ver estado
npm run pm2:status

# Ver logs
npm run pm2:logs
```

### Configurar inicio automático

```bash
# Generar script de startup
pm2 startup

# Ejecutar el comando que PM2 muestra (requiere sudo)
# Ejemplo: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u usuario --hp /home/usuario

# Guardar configuración actual
npm run pm2:save
```

Ahora PM2 iniciará automáticamente la aplicación cuando el servidor se reinicie.

---

## 🔍 Paso 7: Verificar que Funciona

### Verificar que la aplicación está corriendo

```bash
# Ver estado
npm run pm2:status

# Ver logs en tiempo real
npm run pm2:logs

# Probar que responde
curl http://localhost:2530
```

### Verificar desde el navegador

Si tienes el dominio configurado, accede a:
- `http://tu-dominio.com:2530` (sin HTTPS)
- `https://tu-dominio.com` (si tienes proxy reverso configurado)

---

## 🌐 Paso 8: Configurar Proxy Reverso (Nginx/Apache)

### Opción A: Nginx

Crear archivo de configuración:

```bash
sudo nano /etc/nginx/sites-available/bitcan
```

Contenido:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Redirigir a HTTPS (si tienes SSL)
    # return 301 https://$server_name$request_uri;

    # O servir directamente en HTTP
    location / {
        proxy_pass http://localhost:2530;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Habilitar sitio:

```bash
sudo ln -s /etc/nginx/sites-available/bitcan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Opción B: Apache

Crear archivo de configuración:

```bash
sudo nano /etc/apache2/sites-available/bitcan.conf
```

Contenido:

```apache
<VirtualHost *:80>
    ServerName tu-dominio.com
    ServerAlias www.tu-dominio.com

    ProxyPreserveHost On
    ProxyPass / http://localhost:2530/
    ProxyPassReverse / http://localhost:2530/

    <Proxy *>
        Order allow,deny
        Allow from all
    </Proxy>
</VirtualHost>
```

Habilitar módulos y sitio:

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2ensite bitcan
sudo systemctl reload apache2
```

---

## 🔐 Paso 9: Configurar SSL (Let's Encrypt)

### Con Certbot

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx
# O para Apache:
# sudo apt install certbot python3-certbot-apache

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
# O para Apache:
# sudo certbot --apache -d tu-dominio.com -d www.tu-dominio.com
```

Certbot configurará automáticamente HTTPS y renovación automática.

---

## 🔄 Paso 10: Actualizar Variables de Entorno

Después de configurar el dominio, actualiza `.env.production`:

```env
NEXTAUTH_URL=https://tu-dominio.com
```

Y reinicia la aplicación:

```bash
npm run pm2:restart
```

---

## 📊 Comandos de Mantenimiento

### Ver logs

```bash
# Logs en tiempo real
npm run pm2:logs

# Solo errores
pm2 logs bitcan --err

# Solo salida estándar
pm2 logs bitcan --out
```

### Reiniciar aplicación

```bash
npm run pm2:restart
```

### Detener aplicación

```bash
npm run pm2:stop
```

### Actualizar código

```bash
# Desde el directorio del proyecto
git pull origin main  # o la rama que uses

# Reinstalar dependencias si hay cambios
npm install

# Rebuild
npm run build

# Reiniciar
npm run pm2:restart
```

### Deploy completo (actualizar código)

```bash
# Pull + build + restart
git pull origin main && npm install && npm run build && npm run pm2:restart
```

O usar el script de deploy:

```bash
npm run deploy
```

---

## 🔥 Firewall

Asegúrate de que el puerto 2530 esté abierto (si lo necesitas acceder directamente):

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 2530/tcp

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=2530/tcp
sudo firewall-cmd --reload
```

**Nota**: Si usas Nginx/Apache como proxy, no necesitas abrir el puerto 2530 públicamente, solo el 80/443.

---

## ✅ Checklist de Deployment

- [ ] Repositorio clonado en el servidor
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env.production` creado y configurado
- [ ] `NEXTAUTH_SECRET` generado y configurado
- [ ] Migraciones de base de datos aplicadas
- [ ] Build de producción exitoso (`npm run build`)
- [ ] Aplicación iniciada con PM2
- [ ] Inicio automático configurado (`pm2 startup`)
- [ ] Proxy reverso configurado (Nginx/Apache)
- [ ] SSL configurado (Let's Encrypt)
- [ ] Firewall configurado
- [ ] Aplicación accesible desde el navegador
- [ ] Logs funcionando correctamente

---

## 🐛 Troubleshooting

### La aplicación no inicia

```bash
# Ver logs de PM2
npm run pm2:logs

# Ver información detallada
pm2 show bitcan

# Verificar que el puerto no esté en uso
sudo lsof -i :2530
```

### Error de conexión a base de datos

1. Verificar variables de entorno en `.env.production`
2. Verificar que el VPS acepta conexiones remotas
3. Verificar firewall del VPS
4. Probar conexión manual:
```bash
mysql -h 64.176.18.16 -P 3306 -u bitcanc_s1mple -p bitcanc_usuarios
```

### Error 502 Bad Gateway (Nginx)

1. Verificar que la aplicación está corriendo:
```bash
npm run pm2:status
```

2. Verificar que responde en localhost:
```bash
curl http://localhost:2530
```

3. Verificar configuración de Nginx:
```bash
sudo nginx -t
```

### Puerto 2530 en uso

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :2530

# Matar el proceso si es necesario
sudo kill -9 <PID>
```

---

## 📞 Comandos Rápidos de Referencia

```bash
# Deploy completo
git pull && npm install && npm run build && npm run pm2:restart

# Ver estado
npm run pm2:status

# Ver logs
npm run pm2:logs

# Reiniciar
npm run pm2:restart

# Verificar migraciones
npm run migrations:check

# Aplicar migraciones
npm run migrations:run
```

---

## 🔄 Actualización Futura

Para actualizar la aplicación en el futuro:

```bash
cd /ruta/al/proyecto/bitcan
git pull origin main
npm install
npm run build
npm run pm2:restart
```

O usar el script de deploy:

```bash
npm run deploy
```

---

*Última actualización: Enero 2025*
*Puerto de producción: 2530*

