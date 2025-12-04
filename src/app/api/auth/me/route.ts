import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Obtener token de las cookies
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





