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

    // Obtener estadísticas globales del sistema
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_usuarios,
        (SELECT COUNT(*) FROM users WHERE role = 'estudiante') as total_estudiantes,
        (SELECT COUNT(*) FROM users WHERE role = 'profesor') as total_profesores,
        (SELECT COUNT(*) FROM users WHERE role = 'superadmin') as total_superadmins,
        (SELECT COUNT(*) FROM courses) as total_cursos,
        (SELECT COUNT(*) FROM lessons) as total_lecciones,
        (SELECT COUNT(*) FROM user_courses) as total_inscripciones,
        (SELECT COUNT(*) FROM user_lessons WHERE completed = 1) as lecciones_completadas,
        (SELECT COUNT(*) FROM users WHERE profile_completed = 1) as perfiles_completados,
        (SELECT COUNT(*) FROM users WHERE profile_completed = 0) as perfiles_pendientes
    `;

    const stats = await query(statsQuery);

    return NextResponse.json({
      success: true,
      stats: stats[0]
    });

  } catch (error) {
    console.error('Error fetching system stats:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





