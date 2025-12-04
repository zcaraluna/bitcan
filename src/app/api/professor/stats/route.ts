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
    if (!decoded || decoded.role !== 'profesor') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const instructorId = decoded.id;

    // Obtener estadísticas del profesor
    const stats = await queryOne(`
      SELECT 
        COUNT(DISTINCT c.id) as total_cursos,
        COUNT(DISTINCT uc.user_id) as total_estudiantes,
        COUNT(DISTINCT l.id) as total_lecciones,
        COUNT(DISTINCT ul.id) as lecciones_completadas,
        COALESCE(AVG(progreso.progreso_promedio), 0) as progreso_general
      FROM courses c
      JOIN course_instructors ci ON c.id = ci.course_id
      LEFT JOIN user_courses uc ON c.id = uc.course_id
      LEFT JOIN lessons l ON c.id = l.course_id
      LEFT JOIN user_lessons ul ON l.id = ul.lesson_id AND ul.completed = 1
      LEFT JOIN (
        SELECT course_id, AVG(
          (SELECT COUNT(*) FROM user_lessons ul 
           JOIN lessons l ON ul.lesson_id = l.id 
           WHERE l.course_id = uc2.course_id AND ul.user_id = uc2.user_id AND ul.completed = 1) * 100.0 /
          (SELECT COUNT(*) FROM lessons l2 WHERE l2.course_id = uc2.course_id)
        ) as progreso_promedio
        FROM user_courses uc2
        GROUP BY course_id
      ) progreso ON c.id = progreso.course_id
      WHERE ci.instructor_id = ?
    `, [instructorId]);

    // Obtener resultados pendientes de calificación manual
    const pendingResults = await queryOne(`
      SELECT COUNT(*) as total
      FROM quiz_results qr
      JOIN quizzes q ON qr.quiz_id = q.id
      JOIN courses c ON q.course_id = c.id
      JOIN course_instructors ci ON c.id = ci.course_id
      WHERE ci.instructor_id = ? AND qr.needs_manual_grading = 1
    `, [instructorId]);

    return NextResponse.json({
      success: true,
      data: {
        total_cursos: stats?.total_cursos || 0,
        total_estudiantes: stats?.total_estudiantes || 0,
        total_lecciones: stats?.total_lecciones || 0,
        lecciones_completadas: stats?.lecciones_completadas || 0,
        progreso_general: Math.round(stats?.progreso_general || 0),
        resultados_pendientes: pendingResults?.total || 0,
      }
    });

  } catch (error) {
    console.error('Error fetching professor stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

