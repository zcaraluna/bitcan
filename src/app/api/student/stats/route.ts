import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'estudiante') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const userId = decoded.id;

    // Obtener estadísticas del estudiante
    const stats = await queryOne(`
      SELECT 
        (SELECT COUNT(*) FROM user_courses WHERE user_id = ?) as total_cursos,
        (SELECT COUNT(*) FROM user_courses WHERE user_id = ? AND completed_at IS NOT NULL) as cursos_completados,
        (SELECT COUNT(*) FROM user_courses WHERE user_id = ? AND completed_at IS NULL AND progress > 0) as cursos_en_progreso,
        (SELECT COUNT(*) FROM certificates WHERE user_id = ? AND status = 'issued') as certificados_obtenidos,
        (SELECT COALESCE(AVG(progress), 0) FROM user_courses WHERE user_id = ?) as progreso_promedio,
        (SELECT COUNT(*) FROM user_lessons ul 
         JOIN lessons l ON ul.lesson_id = l.id 
         WHERE ul.user_id = ? AND ul.completed = 1) as lecciones_completadas,
        (SELECT COUNT(*) FROM quiz_results qr 
         JOIN quizzes q ON qr.quiz_id = q.id 
         WHERE qr.user_id = ?) as quizzes_completados
    `, [userId, userId, userId, userId, userId, userId, userId]);

    return NextResponse.json({
      success: true,
      data: {
        totalCursos: stats?.total_cursos || 0,
        completados: stats?.cursos_completados || 0,
        enProgreso: stats?.cursos_en_progreso || 0,
        certificados: stats?.certificados_obtenidos || 0,
        progresoPromedio: Math.round(stats?.progreso_promedio || 0),
        leccionesCompletadas: stats?.lecciones_completadas || 0,
        quizzesCompletados: stats?.quizzes_completados || 0
      }
    });

  } catch (error) {
    console.error('Error fetching student stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

