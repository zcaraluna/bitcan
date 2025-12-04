# 🌐 Conexión a Base de Datos VPS

## 📊 Configuración Actual

La aplicación está configurada para conectarse a la base de datos MySQL en tu VPS:

```
Host: 64.176.18.16
Puerto: 3306
Base de datos: bitcanc_usuarios
Usuario: bitcanc_s1mple
Contraseña: .Recalde97123
```

---

## ✅ Verificar Conexión desde tu PC

### 1. Probar con MySQL CLI

```bash
mysql -h 64.176.18.16 -P 3306 -u bitcanc_s1mple -p bitcanc_usuarios
# Cuando pida contraseña: .Recalde97123
```

### 2. Probar con MySQL Workbench

1. Abrir MySQL Workbench
2. Nueva Conexión
3. Configurar:
   - **Connection Name**: BITCAN VPS
   - **Hostname**: 64.176.18.16
   - **Port**: 3306
   - **Username**: bitcanc_s1mple
   - **Password**: .Recalde97123
   - **Default Schema**: bitcanc_usuarios
4. Test Connection

### 3. Probar con Node.js (script de prueba)

Crear archivo `test-connection.js` en la raíz de bitcan:

```javascript
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: '64.176.18.16',
      port: 3306,
      user: 'bitcanc_s1mple',
      password: '.Recalde97123',
      database: 'bitcanc_usuarios'
    });
    
    console.log('✅ Conexión exitosa al VPS!');
    
    const [rows] = await connection.execute('SELECT COUNT(*) as total FROM users');
    console.log(`📊 Total de usuarios: ${rows[0].total}`);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

testConnection();
```

Ejecutar:
```bash
node test-connection.js
```

---

## 🔒 Requisitos del VPS

Para que Next.js se conecte al VPS, asegúrate que:

### 1. MySQL acepta conexiones remotas

Editar en el VPS: `/etc/mysql/mysql.conf.d/mysqld.cnf`

```ini
# Cambiar:
bind-address = 127.0.0.1

# Por:
bind-address = 0.0.0.0
```

Reiniciar MySQL:
```bash
sudo systemctl restart mysql
```

### 2. Usuario tiene permisos remotos

En MySQL del VPS:

```sql
-- Ver permisos actuales
SELECT host, user FROM mysql.user WHERE user = 'bitcanc_s1mple';

-- Si solo muestra 'localhost', crear acceso remoto:
CREATE USER 'bitcanc_s1mple'@'%' IDENTIFIED BY '.Recalde97123';
GRANT ALL PRIVILEGES ON bitcanc_usuarios.* TO 'bitcanc_s1mple'@'%';
FLUSH PRIVILEGES;
```

### 3. Firewall permite puerto 3306

```bash
# Ubuntu/Debian
sudo ufw allow 3306/tcp
sudo ufw reload

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3306/tcp
sudo firewall-cmd --reload
```

---

## 🛠️ Troubleshooting

### Error: "connect ETIMEDOUT"

**Causa**: El firewall bloquea el puerto 3306

**Solución**: 
1. Verificar firewall del VPS
2. Verificar firewall de tu proveedor de hosting (panel de control)

### Error: "Access denied for user"

**Causa**: Usuario no tiene permisos remotos

**Solución**: Ejecutar los comandos SQL de la sección "Permisos remotos"

### Error: "Host is not allowed to connect"

**Causa**: MySQL solo acepta conexiones locales

**Solución**: Cambiar `bind-address` en la configuración de MySQL

### Error: "Unknown database"

**Causa**: La base de datos no existe

**Solución**: 
```sql
CREATE DATABASE bitcanc_usuarios CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 🔐 Seguridad Recomendada

### 1. Restringir acceso por IP

En lugar de permitir desde cualquier host (`%`), restringir a tu IP:

```sql
CREATE USER 'bitcanc_s1mple'@'TU_IP_PUBLICA' IDENTIFIED BY '.Recalde97123';
GRANT ALL PRIVILEGES ON bitcanc_usuarios.* TO 'bitcanc_s1mple'@'TU_IP_PUBLICA';
```

### 2. Usar SSL/TLS

Agregar a `src/lib/db.ts`:

```typescript
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'bitcanc_usuarios',
  user: process.env.DB_USER || 'bitcanc_s1mple',
  password: process.env.DB_PASSWORD || '',
  ssl: {
    rejectUnauthorized: false // O true con certificado válido
  },
  // ... resto de configuración
});
```

### 3. VPN (más seguro)

Considera usar una VPN para conectarte al VPS y mantener MySQL solo en localhost.

---

## 📝 Variables de Entorno

Tu archivo `.env.local` actual:

```env
DB_HOST=64.176.18.16
DB_PORT=3306
DB_NAME=bitcanc_usuarios
DB_USER=bitcanc_s1mple
DB_PASSWORD=.Recalde97123
```

Para producción, considera usar:
- **DB_HOST**: IP privada si usas VPN
- **SSL**: Habilitado
- **Contraseña**: Más segura

---

## ✅ Checklist de Conexión

- [ ] MySQL acepta conexiones remotas (`bind-address = 0.0.0.0`)
- [ ] Usuario tiene permisos remotos (`user@'%'` o `user@'tu-ip'`)
- [ ] Puerto 3306 abierto en firewall del VPS
- [ ] Puerto 3306 abierto en panel de hosting
- [ ] Probado con MySQL CLI o Workbench
- [ ] Script de prueba funciona
- [ ] Next.js se conecta correctamente

---

## 🚀 Probar la Aplicación

```bash
npm run dev
```

La aplicación intentará conectarse a `64.176.18.16:3306` automáticamente.

Revisa la consola para ver si hay errores de conexión.

---

## 📞 Comandos Útiles

```bash
# Ver conexiones activas en MySQL (desde el VPS)
mysql -e "SHOW PROCESSLIST;"

# Ver usuarios y hosts permitidos
mysql -e "SELECT user, host FROM mysql.user;"

# Probar conexión con timeout
mysql -h 64.176.18.16 -P 3306 -u bitcanc_s1mple -p --connect-timeout=5

# Ver logs de MySQL (VPS)
sudo tail -f /var/log/mysql/error.log
```






