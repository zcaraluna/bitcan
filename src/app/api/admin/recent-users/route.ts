import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Obtener usuarios recientes
    const usersQuery = `
      SELECT u.id, u.name, u.email, u.role, u.created_at, u.profile_completed
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 10
    `;

    const users = await query(usersQuery);

    return NextResponse.json({
      success: true,
      users: users
    });

  } catch (error) {
    console.error('Error fetching recent users:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





