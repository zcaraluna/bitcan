# 🔀 Redirección: bitcan.com.py/web_quira/* → quira.s1mple.cloud

## 📋 Instrucciones

Para redirigir todas las solicitudes de `bitcan.com.py/web_quira/*` a `quira.s1mple.cloud`, sigue estos pasos:

### 1. Conectarse al VPS

```bash
ssh root@tu-vps
```

### 2. Crear archivo de redirección HTTP

```bash
nano /home/bitcanc/conf/web/bitcan.com.py/nginx.conf_custom
```

**Contenido:**
```nginx
# Redirigir todas las solicitudes de /web_quira/* a quira.s1mple.cloud
location /web_quira {
    return 301 http://quira.s1mple.cloud$request_uri;
}

location /web_quira/ {
    return 301 http://quira.s1mple.cloud$request_uri;
}
```

### 3. Crear archivo de redirección HTTPS

```bash
nano /home/bitcanc/conf/web/bitcan.com.py/nginx.ssl.conf_custom
```

**Contenido:**
```nginx
# Redirigir todas las solicitudes de /web_quira/* a quira.s1mple.cloud (HTTPS)
location /web_quira {
    return 301 https://quira.s1mple.cloud$request_uri;
}

location /web_quira/ {
    return 301 https://quira.s1mple.cloud$request_uri;
}
```

### 4. Recargar Nginx

```bash
# Verificar configuración
nginx -t

# Recargar Nginx
systemctl reload nginx
# O si usas HestiaCP:
v-restart-web bitcanc
```

### 5. Verificar

Prueba accediendo a:
- `http://bitcan.com.py/web_quira` → Debe redirigir a `http://quira.s1mple.cloud/web_quira`
- `https://bitcan.com.py/web_quira` → Debe redirigir a `https://quira.s1mple.cloud/web_quira`
- `http://bitcan.com.py/web_quira/cualquier/ruta` → Debe redirigir a `http://quira.s1mple.cloud/web_quira/cualquier/ruta`

## ⚠️ Notas

- Los archivos `nginx.conf_custom` y `nginx.ssl.conf_custom` son incluidos automáticamente por HestiaCP
- La redirección es permanente (301), lo que es bueno para SEO
- La ruta completa (`$request_uri`) se preserva en la redirección
- Si `quira.s1mple.cloud` no tiene SSL, cambia `https://` por `http://` en el archivo SSL

## 🔧 Solución de Problemas

Si la redirección no funciona:

1. **Verificar que los archivos existen:**
   ```bash
   ls -la /home/bitcanc/conf/web/bitcan.com.py/nginx*.conf_custom
   ```

2. **Verificar logs de Nginx:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

3. **Verificar configuración de Nginx:**
   ```bash
   nginx -t
   ```

4. **Verificar que HestiaCP no sobrescriba los archivos:**
   - Los archivos `*_custom` no deberían ser sobrescritos por HestiaCP
   - Si se reconstruye el dominio, estos archivos deberían persistir

