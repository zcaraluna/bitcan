# 🚀 Guía de Inicio Rápido - BITCAN

## Requisitos Previos

- Node.js 18+ instalado
- MySQL 8+ corriendo
- Base de datos `bitcanc_usuarios` configurada

## Pasos de Instalación

### 1. Instalar Dependencias

```bash
cd bitcan
npm install
```

### 2. Configurar Variables de Entorno

El archivo `.env.local` ya está creado con las credenciales de tu base de datos:

```env
DB_HOST=localhost
DB_NAME=bitcanc_usuarios
DB_USER=bitcanc_s1mple
DB_PASSWORD=.Recalde97123

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=bitcan-secret-2025
```

### 3. Verificar Base de Datos (VPS)

La base de datos está en un VPS remoto. Prueba la conexión:

```bash
# Opción 1: Con script de prueba
node test-db.js

# Opción 2: Con MySQL CLI
mysql -h 64.176.18.16 -P 3306 -u bitcanc_s1mple -p bitcanc_usuarios
# Contraseña: .Recalde97123
```

**Ver `CONEXION-VPS.md` para configuración detallada del VPS**

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

## 🎯 Rutas Principales

### Públicas
- `/` - Página de inicio
- `/login` - Iniciar sesión
- `/registro` - Crear cuenta

### Privadas (requieren login)
- `/dashboard` - Panel principal
- `/cursos` - Catálogo de cursos
- `/certificados` - Mis certificados
- `/mensajes` - Bandeja de mensajes

## 👤 Usuarios de Prueba

Puedes usar estos usuarios existentes en la base de datos:

### Superadmin
- **Email**: bitcan@bitcan.com.py
- **Rol**: superadmin

### Profesor
- **Email**: recaldev.ga@gmail.com
- **Rol**: profesor

### Estudiante
- **Email**: andres.fpy@gmail.com
- **Rol**: estudiante

*Nota: Las contraseñas están hasheadas en la BD. Necesitarás acceso a la base de datos para crear nuevos usuarios o resetear contraseñas.*

## 🏗️ Estructura de Componentes

### Layout Principal
- `Header` - Barra superior con navegación
- `Sidebar` - Menú lateral (responsive)
- `DashboardLayout` - Contenedor principal

### Componentes de UI
- `Button` - Botones con variantes
- `Alert` - Alertas de sistema
- `StatsCard` - Tarjetas de estadísticas
- `CourseCard` - Tarjetas de curso
- `LoadingSpinner` - Indicador de carga

## 🎨 Estilos y Diseño

### Colores
```css
--primary: #2E5090
--secondary: #1a3a70
--background: #eff1f4
```

### Clases Utility
- `.btn-primary` - Botón primario
- `.btn-secondary` - Botón secundario
- `.btn-outline` - Botón con borde
- `.card` - Tarjeta básica
- `.card-stats` - Tarjeta de estadísticas
- `.alert-{tipo}` - Alertas (error, success, warning, info)

## 📡 API Routes

### Autenticación
```typescript
POST /api/auth/login
Body: { email: string, password: string }
Response: { success: boolean, user: User, token: string }
```

### Cursos
```typescript
GET /api/courses
Response: Course[]

GET /api/courses/[id]
Response: Course
```

## 🔐 Sistema de Roles

El sistema maneja 3 tipos de usuarios:

1. **Estudiante**
   - Acceso a cursos inscritos
   - Ver certificados
   - Mensajería

2. **Profesor**
   - Todo lo de estudiante
   - Gestionar cursos propios
   - Ver estudiantes
   - Calificar evaluaciones

3. **Superadmin**
   - Acceso total
   - Gestión de usuarios
   - Reportes del sistema
   - Configuración

## 🛠️ Desarrollo

### Agregar Nueva Página

1. Crear archivo en `/src/app/[ruta]/page.tsx`
2. Usar `DashboardLayout` si es página protegida
3. Agregar ruta en middleware si requiere auth

Ejemplo:
```tsx
import DashboardLayout from '@/components/DashboardLayout';

export default function MiPagina() {
  return (
    <DashboardLayout user={user}>
      <h1>Mi Nueva Página</h1>
    </DashboardLayout>
  );
}
```

### Crear Componente

```tsx
// src/components/MiComponente.tsx
interface MiComponenteProps {
  titulo: string;
}

export default function MiComponente({ titulo }: MiComponenteProps) {
  return <div>{titulo}</div>;
}
```

### Consultar Base de Datos

```typescript
import { query } from '@/lib/db';

// Obtener múltiples registros
const users = await query<User>('SELECT * FROM users WHERE role = ?', ['estudiante']);

// Obtener un solo registro
const user = await queryOne<User>('SELECT * FROM users WHERE id = ?', [userId]);
```

## 📦 Build para Producción

```bash
npm run build
npm start
```

## ⚡ Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start

# Lint
npm run lint
```

## 🐛 Troubleshooting

### Error de conexión a MySQL
- Verifica que MySQL esté corriendo
- Confirma credenciales en `.env.local`
- Verifica que la base de datos `bitcanc_usuarios` exista

### Puerto 3000 en uso
```bash
# Cambiar puerto
PORT=3001 npm run dev
```

### Error de módulos
```bash
# Limpiar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📚 Recursos

- [Documentación Next.js](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Lucide Icons](https://lucide.dev)

## 🆘 Soporte

Para soporte contacta a: bitcan@bitcan.com.py


