import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const courseId = parseInt(params.id);

    // Verificar que el estudiante esté inscrito en el curso
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
        { error: 'No estás inscrito en este curso' },
        { status: 403 }
      );
    }

    // Obtener información del curso
    const course = await queryOne(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.short_description,
        c.identifier,
        c.duration_hours,
        c.duration_minutes,
        c.thumbnail_url,
        c.level,
        c.video_url,
        c.requirements,
        c.learning_objectives,
        (SELECT COUNT(*) FROM user_courses WHERE course_id = c.id) as students_count,
        (SELECT GROUP_CONCAT(u.name SEPARATOR ', ') 
         FROM course_instructors ci 
         JOIN users u ON ci.instructor_id = u.id 
         WHERE ci.course_id = c.id) as instructor,
        (SELECT COUNT(*) FROM certificates WHERE user_id = ? AND course_id = c.id AND status = 'issued') as has_certificate
      FROM courses c
      WHERE c.id = ?
    `, [userId, courseId]);

    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Obtener lecciones con progreso del estudiante
    const lessons = await query(`
      SELECT 
        l.id,
        l.title,
        l.description,
        l.content,
        l.video_url,
        l.duration_minutes,
        l.sort_order as order_index,
        ul.completed,
        ul.completed_at,
        ul.started_at as last_accessed,
        ul.time_watched as progress
      FROM lessons l
      LEFT JOIN user_lessons ul ON l.id = ul.lesson_id AND ul.user_id = ?
      WHERE l.course_id = ?
      ORDER BY l.sort_order ASC
    `, [userId, courseId]);

    // Obtener quizzes con resultados del estudiante
    const quizzes = await query(`
      SELECT 
        q.id,
        q.title,
        q.description,
        q.description as instructions,
        q.time_limit_minutes,
        q.passing_score,
        q.start_datetime,
        q.end_datetime,
        q.results_publish_datetime,
        q.id as order_index,
        q.is_required,
        (SELECT qr.id FROM quiz_results qr WHERE qr.quiz_id = q.id AND qr.user_id = ? ORDER BY qr.completed_at DESC LIMIT 1) as result_id,
        (SELECT qr.score FROM quiz_results qr WHERE qr.quiz_id = q.id AND qr.user_id = ? ORDER BY qr.completed_at DESC LIMIT 1) as score,
        (SELECT qr.max_score FROM quiz_results qr WHERE qr.quiz_id = q.id AND qr.user_id = ? ORDER BY qr.completed_at DESC LIMIT 1) as max_score,
        (SELECT qr.passed FROM quiz_results qr WHERE qr.quiz_id = q.id AND qr.user_id = ? ORDER BY qr.completed_at DESC LIMIT 1) as passed,
        (SELECT qr.completed_at FROM quiz_results qr WHERE qr.quiz_id = q.id AND qr.user_id = ? ORDER BY qr.completed_at DESC LIMIT 1) as completed_at,
        (SELECT COUNT(*) FROM quiz_results qr2 WHERE qr2.quiz_id = q.id AND qr2.user_id = ?) as attempts
      FROM quizzes q
      WHERE q.course_id = ?
      ORDER BY q.created_at ASC
    `, [userId, userId, userId, userId, userId, userId, courseId]);

    // Obtener recursos del curso
    const resources = await query(`
      SELECT 
        cr.id,
        cr.title,
        cr.description,
        cr.file_path,
        cr.url,
        cr.file_type,
        cr.file_size,
        cr.created_at,
        u.name as created_by_name
      FROM course_resources cr
      LEFT JOIN users u ON cr.created_by = u.id
      WHERE cr.course_id = ?
      ORDER BY cr.created_at DESC
    `, [courseId]);

    // Calcular estadísticas
    const stats = {
      total_lessons: lessons.length,
      completed_lessons: lessons.filter((l: any) => l.completed).length,
      total_quizzes: quizzes.length,
      completed_quizzes: quizzes.filter((q: any) => q.result_id).length,
      progress: enrollment.progress,
      course_completed: enrollment.course_completed
    };

    return NextResponse.json({
      success: true,
      data: {
        course: {
          ...course,
          ...enrollment
        },
        lessons,
        quizzes,
        resources,
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching course details:', error);
    return NextResponse.json(
      { error: 'Error al obtener detalles del curso' },
      { status: 500 }
    );
  }
}

