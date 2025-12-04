# BITCAN - Plataforma Educativa

Plataforma educativa moderna construida con Next.js 14, TypeScript y Tailwind CSS.

## 🚀 Características

- ✨ Next.js 14 con App Router
- 🎨 Tailwind CSS con diseño personalizado
- 🔐 Autenticación con JWT
- 💾 MySQL con pool de conexiones
- 📱 Diseño responsive
- 🎯 TypeScript para type-safety
- 🔔 Sistema de notificaciones
- 📊 Dashboard con estadísticas
- 🎓 Sistema de cursos y lecciones
- 📝 Quizzes y evaluaciones
- 🏆 Certificados

## 🎨 Diseño

### Colores
- **Primary**: #2E5090
- **Secondary**: #1a3a70
- **Background**: #eff1f4

### Fuente
- Lato (Google Fonts)

### Componentes
- Header con gradiente
- Sidebar colapsable
- Cards con hover effects
- Botones con múltiples variantes
- Alerts con iconos
- Animaciones suaves

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Configurar las variables de entorno en .env.local
# DB_HOST=localhost
# DB_NAME=bitcanc_usuarios
# DB_USER=bitcanc_s1mple
# DB_PASSWORD=tu-password

# Ejecutar en desarrollo
npm run dev
```

## 🗄️ Base de Datos

La aplicación se conecta a MySQL usando las credenciales configuradas en `.env.local`.

### Tablas principales:
- `users` - Usuarios del sistema
- `courses` - Cursos disponibles
- `lessons` - Lecciones de los cursos
- `quizzes` - Evaluaciones
- `user_courses` - Inscripciones
- `certificates` - Certificados

## 🛣️ Rutas

### Públicas
- `/` - Página de inicio
- `/login` - Iniciar sesión
- `/registro` - Registro de usuario

### Privadas (requieren autenticación)
- `/dashboard` - Panel principal
- `/cursos` - Lista de cursos
- `/cursos/[id]` - Detalle de curso
- `/certificados` - Mis certificados
- `/mensajes` - Mensajería
- `/perfil` - Perfil de usuario

### Admin (requieren rol específico)
- `/usuarios` - Gestión de usuarios (superadmin)
- `/reportes` - Reportes del sistema (superadmin)
- `/estudiantes` - Lista de estudiantes (profesor)

## 🏗️ Estructura del Proyecto

```
bitcan/
├── src/
│   ├── app/              # Páginas y rutas (App Router)
│   │   ├── api/          # API Routes
│   │   ├── dashboard/    # Dashboard
│   │   ├── login/        # Login
│   │   └── ...
│   ├── components/       # Componentes React
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── ...
│   ├── lib/             # Utilidades y configuración
│   │   ├── db.ts        # Conexión a base de datos
│   │   ├── auth.ts      # Autenticación
│   │   └── ...
│   ├── types/           # Tipos de TypeScript
│   │   └── index.ts
│   └── styles/          # Estilos globales
│       └── globals.css
├── public/              # Archivos estáticos
├── .env.example         # Ejemplo de variables de entorno
├── next.config.js       # Configuración de Next.js
├── tailwind.config.ts   # Configuración de Tailwind
└── tsconfig.json        # Configuración de TypeScript
```

## 🔐 Autenticación

El sistema utiliza JWT para autenticación. Los tokens se generan en el login y se verifican en cada petición a rutas protegidas.

### Roles disponibles:
- `estudiante` - Acceso básico a cursos
- `profesor` - Gestión de cursos y estudiantes
- `superadmin` - Acceso total al sistema

## 📝 API Routes

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registro
- `POST /api/auth/logout` - Cerrar sesión

### Cursos
- `GET /api/courses` - Listar cursos
- `GET /api/courses/[id]` - Detalle de curso
- `POST /api/courses` - Crear curso (profesor/admin)

### Usuarios
- `GET /api/users` - Listar usuarios (admin)
- `GET /api/users/[id]` - Detalle de usuario
- `PUT /api/users/[id]` - Actualizar usuario

## 🚀 Deployment

```bash
# Build para producción
npm run build

# Ejecutar en producción
npm start
```

## 📄 Licencia

© 2025 BITCAN. Todos los derechos reservados.


