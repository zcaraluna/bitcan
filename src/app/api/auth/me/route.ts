import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { verifyToken } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Intentar obtener sesión de NextAuth primero (para usuarios de Google)
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      // Usuario autenticado con NextAuth (Google)
      const userId = (session.user as any).id;
      if (userId) {
        const user = await queryOne(`
          SELECT 
            u.id,
            u.name,
            u.email,
            u.role,
            u.email_verified,
            u.is_active,
            u.profile_completed,
            u.last_login,
            u.created_at,
            u.nombres,
            u.apellidos,
            u.tipo_documento,
            u.numero_documento,
            u.fecha_nacimiento,
            u.genero,
            u.telefono,
            u.pais,
            u.departamento,
            u.ciudad,
            u.barrio,
            u.direccion,
            u.ocupacion,
            u.empresa
          FROM users u
          WHERE u.id = ? AND u.is_active = 1
        `, [userId]);

        if (user) {
          // Generar token JWT y establecer cookie
          const { generateToken } = await import('@/lib/auth');
          const jwtToken = generateToken(user as any);
          
          const response = NextResponse.json({
            success: true,
            user: user,
          });
          
          response.cookies.set('auth-token', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
          });
          
          return response;
        }
      }
    }

    // Si no hay sesión de NextAuth, intentar con token JWT tradicional
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Token inválido' },
        { status: 401 }
      );
    }

    // Obtener datos completos del usuario con perfil
    const user = await queryOne(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.email_verified,
        u.is_active,
        u.profile_completed,
        u.last_login,
        u.created_at,
        u.nombres,
        u.apellidos,
        u.tipo_documento,
        u.numero_documento,
        u.fecha_nacimiento,
        u.genero,
        u.telefono,
        u.pais,
        u.departamento,
        u.ciudad,
        u.barrio,
        u.direccion,
        u.ocupacion,
        u.empresa
      FROM users u
      WHERE u.id = ? AND u.is_active = 1
    `, [decoded.id]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





