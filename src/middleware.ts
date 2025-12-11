import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/', '/login', '/completar-perfil', '/detectar-conexion'];

// Rutas que requieren autenticación
const protectedRoutes = [
  '/cursos',
  '/certificados',
  '/mensajes',
  '/perfil',
  '/configuracion',
];

// Rutas solo para superadmin
const superadminRoutes = [
  '/dashboard_superadmin',
  '/usuarios',
  '/reportes',
  '/sistema',
];

// Rutas solo para profesor
const profesorRoutes = [
  '/dashboard_profesor',
  '/estudiantes',
  '/evaluaciones',
];

// Rutas solo para estudiante
const estudianteRoutes = [
  '/dashboard_estudiante',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Permitir siempre rutas de API
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Deshabilitar middleware en desarrollo
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }
  
  // Si es ruta pública, permitir acceso
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isSuperadminRoute = superadminRoutes.some(route => pathname.startsWith(route));
  const isProfesorRoute = profesorRoutes.some(route => pathname.startsWith(route));
  const isEstudianteRoute = estudianteRoutes.some(route => pathname.startsWith(route));
  
  // Obtener token de las cookies
  const token = request.cookies.get('auth-token')?.value;
  
  // Si es ruta protegida y no hay token, redirigir a login
  if ((isProtectedRoute || isSuperadminRoute || isProfesorRoute || isEstudianteRoute) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Si hay token, permitir acceso (la validación completa se hace en cada página)
  // Edge Runtime no soporta JWT verification, así que solo verificamos presencia
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard_superadmin/:path*',
    '/dashboard_profesor/:path*',
    '/dashboard_estudiante/:path*',
    '/cursos/:path*',
    '/certificados/:path*',
    '/mensajes/:path*',
    '/perfil/:path*',
    '/configuracion/:path*',
    '/usuarios/:path*',
    '/reportes/:path*',
    '/sistema/:path*',
    '/estudiantes/:path*',
    '/evaluaciones/:path*',
    '/completar-perfil',
  ],
};


