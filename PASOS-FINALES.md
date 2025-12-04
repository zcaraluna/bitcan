# 🎯 Pasos Finales para Poner en Funcionamiento BITCAN

## ✅ Estado Actual

La aplicación está funcionalmente completa con:
- ✅ Sistema de autenticación (JWT)
- ✅ Dashboards por rol (estudiante, profesor, superadmin)
- ✅ Sistema de cursos y lecciones
- ✅ Sistema de certificados
- ✅ Sistema de mensajería
- ✅ API completa
- ✅ Base de datos conectada al VPS

---

## 🔴 Pasos Críticos Pendientes

### 1. **Configurar Variables de Entorno para Producción**

**Archivo**: `.env.local` o `.env.production`

```env
# Base de Datos (VPS)
DB_HOST=64.176.18.16
DB_PORT=3306
DB_NAME=bitcanc_usuarios
DB_USER=bitcanc_s1mple
DB_PASSWORD=.Recalde97123

# Next.js
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=bitcan-secret-2025-cambiar-en-produccion

# Opcional: SSL para MySQL
DB_SSL=false
```

**Acción requerida**: 
- [ ] Crear archivo `.env.production` con valores de producción
- [ ] Cambiar `NEXTAUTH_SECRET` por uno seguro (generar con: `openssl rand -base64 32`)
- [ ] Actualizar `NEXTAUTH_URL` con el dominio real

---

### 2. **Habilitar Middleware en Producción**

**Archivo**: `src/middleware.ts` (línea 44-47)

El middleware está deshabilitado en desarrollo. Verificar que funcione correctamente:

```typescript
// Actualmente deshabilitado en desarrollo
if (process.env.NODE_ENV === 'development') {
  return NextResponse.next();
}
```

**Acción requerida**:
- [ ] Probar middleware en modo producción localmente
- [ ] Verificar que las rutas protegidas redirijan correctamente
- [ ] Asegurar que la validación de JWT funcione en producción

---

### 3. **Configurar SSL/TLS para MySQL (Recomendado)**

**Archivo**: `src/lib/db.ts`

Para conexiones seguras a la base de datos en producción:

```typescript
const pool = mysql.createPool({
  // ... configuración actual
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false // O true con certificado válido
  } : undefined,
});
```

**Acción requerida**:
- [ ] Evaluar si se necesita SSL para la conexión MySQL
- [ ] Si es necesario, configurar certificados SSL en el VPS
- [ ] Habilitar SSL en producción

---

### 4. **Configurar Dominio y HTTPS**

**Archivo**: `next.config.js`

```javascript
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'tu-dominio.com'], // Agregar dominio de producción
  },
  // Para producción con dominio personalizado
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
}
```

**Acción requerida**:
- [ ] Configurar dominio en el servidor de producción
- [ ] Configurar certificado SSL (Let's Encrypt recomendado)
- [ ] Actualizar `next.config.js` con el dominio de producción
- [ ] Configurar redirección HTTP → HTTPS

---

### 5. **Optimizar para Producción**

**Build de producción**:

```bash
npm run build
```

**Verificar**:
- [ ] El build se completa sin errores
- [ ] No hay warnings críticos
- [ ] Las imágenes se optimizan correctamente
- [ ] Los bundles están optimizados

**Acción requerida**:
- [ ] Ejecutar `npm run build` y verificar que no haya errores
- [ ] Revisar el tamaño de los bundles
- [ ] Optimizar imágenes grandes si es necesario

---

### 6. **Configurar Servidor de Producción**

**Opciones**:

#### Opción A: VPS con PM2 (Recomendado)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicación
pm2 start npm --name "bitcan" -- start

# Configurar para iniciar al arrancar
pm2 startup
pm2 save
```

#### Opción B: Docker

Crear `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Opción C: Vercel/Netlify (Más fácil)

- Conectar repositorio
- Configurar variables de entorno
- Deploy automático

**Acción requerida**:
- [ ] Elegir método de deployment
- [ ] Configurar servidor/proveedor
- [ ] Configurar variables de entorno en el servidor
- [ ] Probar que la aplicación funcione en producción

---

### 7. **Funcionalidades Pendientes (Opcionales pero Recomendadas)**

#### 7.1. OAuth con Google
**Archivo**: `src/app/login/page.tsx` (línea 68)

```typescript
// TODO: Implementar Google OAuth cuando esté disponible
```

**Acción requerida**:
- [ ] Configurar Google OAuth en Google Cloud Console
- [ ] Agregar credenciales a variables de entorno
- [ ] Implementar integración con NextAuth

#### 7.2. Sistema de Recuperación de Contraseña
**Estado**: Mencionado pero no implementado completamente

**Acción requerida**:
- [ ] Crear endpoint `/api/auth/reset-password`
- [ ] Crear página de recuperación
- [ ] Configurar servicio de email (SendGrid, Nodemailer, etc.)

#### 7.3. Verificación de Email
**Estado**: Endpoint existe pero necesita configuración de email

**Acción requerida**:
- [ ] Configurar servicio de email
- [ ] Probar envío de emails de verificación
- [ ] Configurar templates de email

---

### 8. **Seguridad en Producción**

**Checklist de seguridad**:

- [ ] Cambiar todas las contraseñas por defecto
- [ ] Usar `NEXTAUTH_SECRET` fuerte y único
- [ ] Habilitar HTTPS obligatorio
- [ ] Configurar CORS correctamente
- [ ] Revisar permisos de archivos (no exponer `.env`)
- [ ] Configurar rate limiting en API
- [ ] Revisar y actualizar dependencias (`npm audit`)
- [ ] Configurar firewall en el VPS
- [ ] Hacer backup regular de la base de datos

**Acción requerida**:
- [ ] Revisar cada punto del checklist
- [ ] Implementar medidas faltantes

---

### 9. **Monitoreo y Logs**

**Configurar**:

- [ ] Sistema de logs (Winston, Pino, etc.)
- [ ] Monitoreo de errores (Sentry, LogRocket, etc.)
- [ ] Monitoreo de performance
- [ ] Alertas de caídas del servidor

**Acción requerida**:
- [ ] Elegir herramientas de monitoreo
- [ ] Configurar integraciones
- [ ] Probar que funcionen correctamente

---

### 10. **Testing Final**

**Checklist de pruebas**:

- [ ] Login funciona correctamente
- [ ] Dashboards cargan según rol
- [ ] Cursos se muestran y pueden inscribirse
- [ ] Certificados se generan correctamente
- [ ] Mensajería funciona
- [ ] API responde correctamente
- [ ] Base de datos conecta sin problemas
- [ ] Responsive design funciona en móviles
- [ ] Performance es aceptable

**Acción requerida**:
- [ ] Probar cada funcionalidad en producción
- [ ] Documentar problemas encontrados
- [ ] Corregir errores críticos

---

## 📋 Resumen de Prioridades

### 🔴 **CRÍTICO** (Hacer antes de lanzar):
1. Configurar variables de entorno de producción
2. Habilitar y probar middleware en producción
3. Configurar dominio y HTTPS
4. Hacer build de producción y verificar errores
5. Configurar servidor de producción
6. Testing final completo

### 🟡 **IMPORTANTE** (Hacer pronto):
7. Configurar SSL para MySQL
8. Implementar medidas de seguridad
9. Configurar sistema de logs/monitoreo
10. Optimizar performance

### 🟢 **OPCIONAL** (Puede esperar):
11. OAuth con Google
12. Recuperación de contraseña
13. Verificación de email mejorada

---

## 🚀 Comandos para Producción

```bash
# 1. Build
npm run build

# 2. Verificar build
npm start

# 3. Con PM2
pm2 start npm --name "bitcan" -- start

# 4. Ver logs
pm2 logs bitcan

# 5. Reiniciar
pm2 restart bitcan
```

---

## 📞 Siguiente Paso Inmediato

**Recomendación**: Comenzar con los pasos críticos (1-6) en orden. Una vez completados, la aplicación estará lista para producción básica.

**Tiempo estimado**: 2-4 horas para pasos críticos, 1-2 días para incluir opcionales.

---

*Última actualización: Enero 2025*

