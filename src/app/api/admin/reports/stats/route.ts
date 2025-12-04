import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener estadísticas generales del sistema
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

    // Obtener estadísticas generales
    const stats = await queryOne(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_usuarios,
        (SELECT COUNT(*) FROM users WHERE role = 'estudiante') as total_estudiantes,
        (SELECT COUNT(*) FROM users WHERE role = 'profesor') as total_profesores,
        (SELECT COUNT(*) FROM users WHERE role = 'superadmin') as total_superadmins,
        (SELECT COUNT(*) FROM courses) as total_cursos,
        (SELECT COUNT(*) FROM lessons) as total_lecciones,
        (SELECT COUNT(*) FROM user_courses) as total_inscripciones,
        (SELECT COUNT(*) FROM user_lessons WHERE completed = 1) as lecciones_completadas,
        (SELECT COUNT(*) FROM certificates) as certificados_emitidos
    `);

    return NextResponse.json({
      success: true,
      stats: stats || {
        total_usuarios: 0,
        total_estudiantes: 0,
        total_profesores: 0,
        total_superadmins: 0,
        total_cursos: 0,
        total_lecciones: 0,
        total_inscripciones: 0,
        lecciones_completadas: 0,
        certificados_emitidos: 0
      }
    });

  } catch (error) {
    console.error('Error fetching report stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














