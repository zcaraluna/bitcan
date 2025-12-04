import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
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
    const courseId = parseInt(params.id);
    const userId = parseInt(params.userId);

    // Verificar que el profesor es instructor del curso
    const instructorCheck = await queryOne(`
      SELECT ci.course_id
      FROM course_instructors ci
      WHERE ci.course_id = ? AND ci.instructor_id = ?
    `, [courseId, instructorId]);

    if (!instructorCheck) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a este curso' },
        { status: 403 }
      );
    }

    // Verificar que el estudiante está inscrito en el curso
    const enrollment = await queryOne(`
      SELECT 
        uc.started_at,
        uc.completed_at,
        uc.progress,
        uc.completed as course_completed
      FROM user_courses uc
      WHERE uc.user_id = ? AND uc.course_id = ?
    `, [userId, courseId]);

    if (!enrollment) {
      return NextResponse.json(
        { error: 'El estudiante no está inscrito en este curso' },
        { status: 404 }
      );
    }

    // Obtener información del estudiante
    const student = await queryOne(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at,
        up.nombres,
        up.apellidos,
        up.telefono,
        up.direccion,
        up.ciudad,
        up.pais
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ?
    `, [userId]);

    if (!student) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      );
    }

    // Obtener información del curso
    const course = await queryOne(`
      SELECT 
        c.id,
        c.title,
        c.description
      FROM courses c
      WHERE c.id = ?
    `, [courseId]);

    // Obtener lecciones completadas por el estudiante
    const completedLessons = await query(`
      SELECT 
        l.id,
        l.title,
        l.description,
        l.duration_minutes,
        ul.completed_at,
        ul.completed
      FROM user_lessons ul
      JOIN lessons l ON ul.lesson_id = l.id
      WHERE ul.user_id = ? AND l.course_id = ? AND ul.completed = 1
      ORDER BY ul.completed_at DESC
    `, [userId, courseId]);

    // Obtener todas las lecciones del curso con estado de completitud
    const allLessons = await query(`
      SELECT 
        l.id,
        l.title,
        l.description,
        l.duration_minutes,
        l.sort_order,
        ul.completed,
        ul.completed_at
      FROM lessons l
      LEFT JOIN user_lessons ul ON l.id = ul.lesson_id AND ul.user_id = ?
      WHERE l.course_id = ?
      ORDER BY l.sort_order ASC, l.created_at ASC
    `, [userId, courseId]);

    // Obtener resultados de quizzes
    const quizResults = await query(`
      SELECT 
        q.id,
        q.title,
        qr.score,
        qr.max_score,
        (qr.score / qr.max_score * 100) as percentage,
        qr.passed,
        qr.completed_at,
        qr.time_taken_minutes,
        (SELECT COUNT(*) FROM quiz_results qr2 WHERE qr2.quiz_id = q.id AND qr2.user_id = ?) as attempts
      FROM quiz_results qr
      JOIN quizzes q ON qr.quiz_id = q.id
      WHERE qr.user_id = ? AND q.course_id = ? AND qr.max_score > 0
      ORDER BY qr.completed_at DESC
    `, [userId, userId, courseId]);

    // Obtener estadísticas del estudiante en el curso
    const stats = await queryOne(`
      SELECT 
        COUNT(DISTINCT ul.lesson_id) as lecciones_completadas,
        (SELECT COUNT(*) FROM lessons WHERE course_id = ?) as total_lecciones,
        COUNT(DISTINCT qr.quiz_id) as quizzes_completados,
        (SELECT COUNT(*) FROM quizzes WHERE course_id = ?) as total_quizzes,
        AVG(qr.score / qr.max_score * 100) as promedio_quizzes
      FROM user_courses uc
      LEFT JOIN user_lessons ul ON uc.user_id = ul.user_id AND ul.completed = 1
      LEFT JOIN lessons l ON ul.lesson_id = l.id AND l.course_id = ?
      LEFT JOIN quiz_results qr ON uc.user_id = qr.user_id
      LEFT JOIN quizzes q ON qr.quiz_id = q.id AND q.course_id = ?
      WHERE uc.user_id = ? AND uc.course_id = ? AND (qr.max_score IS NULL OR qr.max_score > 0)
    `, [courseId, courseId, courseId, courseId, userId, courseId]);

    return NextResponse.json({
      success: true,
      data: {
        student: {
          ...student,
          enrollment: {
            ...enrollment,
            progress: Math.round(enrollment.progress || 0),
          }
        },
        course,
        completedLessons,
        allLessons,
        quizResults: quizResults.map((qr: any, index: number) => ({
          ...qr,
          id: qr.id || qr.quiz_id || `quiz-${index}`,
          title: qr.title || 'Quiz sin título',
          score: typeof qr.score === 'number' ? qr.score : parseFloat(String(qr.score || 0)),
          max_score: typeof qr.max_score === 'number' ? qr.max_score : parseFloat(String(qr.max_score || 0)),
          percentage: typeof qr.percentage === 'number' ? Math.round(qr.percentage * 10) / 10 : (qr.percentage ? parseFloat(String(qr.percentage)) : 0),
          passed: qr.passed === 1 || qr.passed === true,
          attempts: typeof qr.attempts === 'number' ? qr.attempts : parseInt(String(qr.attempts || 0), 10),
          time_taken_minutes: qr.time_taken_minutes ? (typeof qr.time_taken_minutes === 'number' ? qr.time_taken_minutes : parseFloat(String(qr.time_taken_minutes))) : null,
          completed_at: qr.completed_at || null,
        })),
        stats: {
          ...stats,
          lecciones_completadas: typeof stats?.lecciones_completadas === 'number' ? stats.lecciones_completadas : parseInt(String(stats?.lecciones_completadas || 0), 10),
          total_lecciones: typeof stats?.total_lecciones === 'number' ? stats.total_lecciones : parseInt(String(stats?.total_lecciones || 0), 10),
          quizzes_completados: typeof stats?.quizzes_completados === 'number' ? stats.quizzes_completados : parseInt(String(stats?.quizzes_completados || 0), 10),
          total_quizzes: typeof stats?.total_quizzes === 'number' ? stats.total_quizzes : parseInt(String(stats?.total_quizzes || 0), 10),
          promedio_quizzes: stats?.promedio_quizzes && typeof stats.promedio_quizzes === 'number' ? Math.round(stats.promedio_quizzes * 10) / 10 : (stats?.promedio_quizzes ? parseFloat(String(stats.promedio_quizzes)) : 0),
        }
      }
    });

  } catch (error) {
    console.error('Error fetching student details:', error);
    return NextResponse.json(
      { error: 'Error al obtener los detalles del estudiante' },
      { status: 500 }
    );
  }
}

