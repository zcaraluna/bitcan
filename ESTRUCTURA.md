# 📁 Estructura del Proyecto BITCAN

```
bitcan/
│
├── 📄 Archivos de Configuración
│   ├── package.json              # Dependencias y scripts
│   ├── package-lock.json         # Lock de dependencias
│   ├── tsconfig.json            # Configuración TypeScript
│   ├── tailwind.config.ts       # Configuración Tailwind CSS
│   ├── postcss.config.js        # Configuración PostCSS
│   ├── next.config.js           # Configuración Next.js
│   ├── .eslintrc.json          # Configuración ESLint
│   ├── .gitignore              # Archivos ignorados por Git
│   ├── .env.local              # Variables de entorno (local)
│   └── .env.example            # Ejemplo de variables de entorno
│
├── 📚 Documentación
│   ├── README.md               # Documentación principal
│   ├── INICIO-RAPIDO.md        # Guía de inicio rápido
│   └── ESTRUCTURA.md           # Este archivo
│
├── 🛠️ Scripts de Instalación
│   ├── install.ps1             # Script para Windows
│   └── install.sh              # Script para Linux/macOS
│
└── 📂 src/                     # Código fuente
    │
    ├── 🎨 styles/
    │   └── globals.css         # Estilos globales y clases utility
    │
    ├── 📝 types/
    │   └── index.ts            # Definiciones de tipos TypeScript
    │
    ├── ⚙️ lib/
    │   ├── db.ts              # Conexión a MySQL
    │   └── auth.ts            # Funciones de autenticación
    │
    ├── 🧩 components/
    │   ├── Header.tsx         # Barra superior
    │   ├── Sidebar.tsx        # Menú lateral
    │   ├── DashboardLayout.tsx # Layout principal
    │   ├── StatsCard.tsx      # Tarjetas de estadísticas
    │   ├── CourseCard.tsx     # Tarjetas de curso
    │   ├── Button.tsx         # Componente de botón
    │   ├── Alert.tsx          # Componente de alerta
    │   └── LoadingSpinner.tsx # Indicador de carga
    │
    ├── 🛡️ middleware.ts       # Protección de rutas
    │
    └── 📱 app/                # Páginas y rutas (App Router)
        │
        ├── layout.tsx         # Layout raíz
        ├── page.tsx          # Página de inicio (/)
        │
        ├── 🔐 login/
        │   └── page.tsx      # Página de login
        │
        ├── 📊 dashboard/
        │   └── page.tsx      # Dashboard principal
        │
        ├── 📚 cursos/
        │   └── page.tsx      # Catálogo de cursos
        │
        └── 🔌 api/           # API Routes
            └── auth/
                └── login/
                    └── route.ts # Endpoint de login
```

## 🎯 Descripción de Carpetas

### `/src/app` - Páginas y Rutas
Contiene todas las páginas de la aplicación usando el App Router de Next.js 14.
Cada carpeta representa una ruta de la aplicación.

### `/src/components` - Componentes React
Componentes reutilizables de la interfaz de usuario.
Todos son componentes de cliente ('use client') para interactividad.

### `/src/lib` - Utilidades y Configuración
Funciones auxiliares, conexiones a base de datos y lógica de negocio.

### `/src/types` - Tipos TypeScript
Definiciones de tipos e interfaces para type-safety.

### `/src/styles` - Estilos
Estilos globales y configuración de Tailwind CSS.

## 📄 Archivos Importantes

### Configuración
- **package.json**: Dependencias del proyecto y scripts npm
- **tsconfig.json**: Configuración de TypeScript
- **tailwind.config.ts**: Paleta de colores y tema personalizado
- **.env.local**: Variables de entorno (credenciales de BD)

### Código Principal
- **src/app/layout.tsx**: Layout raíz de la aplicación
- **src/middleware.ts**: Protección de rutas privadas
- **src/lib/db.ts**: Pool de conexiones MySQL
- **src/lib/auth.ts**: JWT y autenticación

### Componentes Core
- **DashboardLayout**: Layout principal con Header + Sidebar
- **Header**: Navegación superior con perfil de usuario
- **Sidebar**: Menú lateral responsive por rol

## 🚀 Flujo de la Aplicación

```
1. Usuario accede a /
   └─> Página pública de inicio

2. Usuario hace clic en "Iniciar Sesión"
   └─> /login
       └─> Formulario de autenticación
           └─> POST /api/auth/login
               └─> Verifica credenciales en MySQL
                   └─> Genera JWT token
                       └─> Redirige a /dashboard

3. Usuario en /dashboard
   └─> middleware.ts verifica autenticación
       └─> Si tiene token: permite acceso
       └─> Si no tiene token: redirige a /login

4. Usuario navega por la app
   └─> Header y Sidebar siempre visibles
   └─> Contenido cambia según la ruta
```

## 🎨 Sistema de Diseño

### Colores
- **Primary**: #2E5090 (Azul corporativo)
- **Secondary**: #1a3a70 (Azul oscuro)
- **Background**: #eff1f4 (Gris claro)

### Componentes de UI
- Botones: 6 variantes (primary, secondary, outline, ghost, success, warning)
- Cards: Básicas y de estadísticas con gradiente
- Alerts: 4 tipos (error, warning, success, info)
- Animaciones: fadeIn, hover-lift

### Responsive
- Mobile: Sidebar colapsable
- Tablet: Grid de 2 columnas
- Desktop: Grid de 6 columnas

## 📊 Base de Datos

### Tablas Principales
- **users**: Usuarios del sistema
- **courses**: Catálogo de cursos
- **lessons**: Lecciones de cursos
- **quizzes**: Evaluaciones
- **user_courses**: Inscripciones
- **certificates**: Certificados emitidos

### Conexión
La conexión se realiza mediante un pool de MySQL2 configurado en `/src/lib/db.ts`

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- JWT para autenticación
- Middleware para rutas protegidas
- Validación de roles por endpoint
- SQL preparados (prevención de inyección)

## 📦 Próximos Pasos

1. **Agregar más páginas**:
   - /certificados
   - /mensajes
   - /perfil
   - /cursos/[id]

2. **Implementar funcionalidades**:
   - Registro de usuarios
   - Recuperación de contraseña
   - OAuth con Google
   - Sistema de notificaciones en tiempo real

3. **Optimizaciones**:
   - Server Components donde sea posible
   - ISR para páginas de cursos
   - Image optimization
   - Lazy loading de componentes

4. **Testing**:
   - Unit tests con Jest
   - E2E tests con Playwright
   - Integration tests para API routes



