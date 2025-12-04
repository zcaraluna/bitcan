import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener estadísticas por rol
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

    // Obtener estadísticas por rol
    const stats = await query(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role'
    );

    // Convertir a objeto
    const roleStats: { [key: string]: number } = {};
    stats.forEach((stat: any) => {
      roleStats[stat.role] = stat.count;
    });

    return NextResponse.json({
      success: true,
      stats: roleStats
    });

  } catch (error) {
    console.error('Error fetching role stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














