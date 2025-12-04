import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener usuarios con sus roles
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener usuarios con información completa
    const users = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.profile_completed,
        u.created_at,
        u.last_login,
        up.nombres,
        up.apellidos
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ORDER BY u.created_at DESC
    `);

    // Obtener estadísticas por rol
    const roleStats = await query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);

    // Formatear estadísticas
    const stats: { [key: string]: number } = {};
    roleStats.forEach((stat: any) => {
      stats[stat.role] = stat.count;
    });

    return NextResponse.json({
      success: true,
      users,
      roleStats: stats
    });

  } catch (error) {
    console.error('Error fetching users for roles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














