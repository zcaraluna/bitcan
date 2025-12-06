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
    if (!decoded || decoded.role !== 'profesor') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const instructorId = decoded.id;
    const courseId = parseInt(params.id);

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

    // Obtener información del curso
    const course = await queryOne(`
      SELECT 
        c.*,
        cc.name as category_name,
        COUNT(DISTINCT uc.user_id) as total_estudiantes,
        COUNT(DISTINCT l.id) as total_lecciones,
        AVG(uc.progress) as progreso_promedio
      FROM courses c
      LEFT JOIN course_categories cc ON c.category_id = cc.id
      LEFT JOIN user_courses uc ON c.id = uc.course_id
      LEFT JOIN lessons l ON c.id = l.course_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [courseId]);

    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Obtener lecciones del curso
    const lessons = await query(`
      SELECT 
        l.*,
        COUNT(DISTINCT ul.user_id) as estudiantes_completaron,
        COUNT(DISTINCT lr.id) as total_recursos
      FROM lessons l
      LEFT JOIN user_lessons ul ON l.id = ul.lesson_id AND ul.completed = 1
      LEFT JOIN lesson_resources lr ON l.id = lr.lesson_id
      WHERE l.course_id = ?
      GROUP BY l.id
      ORDER BY l.sort_order ASC, l.created_at ASC
    `, [courseId]);

    // Obtener estudiantes inscritos
    const students = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        uc.progress,
        uc.started_at,
        uc.completed_at,
        uc.completed,
        up.nombres,
        up.apellidos,
        up.telefono,
        (SELECT COUNT(DISTINCT ul.lesson_id) 
         FROM user_lessons ul
         JOIN lessons l ON ul.lesson_id = l.id
         WHERE ul.user_id = u.id 
           AND ul.completed = 1 
           AND l.course_id = ?) as lecciones_completadas
      FROM user_courses uc
      JOIN users u ON uc.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE uc.course_id = ?
      ORDER BY uc.started_at DESC
    `, [courseId, courseId]);

    // Obtener recursos del curso (tanto de lecciones como del curso directamente)
    const resources = await query(`
      (
        SELECT 
          'lesson' as source_type,
          lr.id,
          lr.title,
          lr.description,
          lr.file_url as file_path,
          lr.file_size,
          lr.file_type,
          NULL as url,
          lr.created_at,
          l.title as lesson_title,
          NULL as user_name
        FROM lesson_resources lr
        JOIN lessons l ON lr.lesson_id = l.id
        WHERE l.course_id = ?
      )
      UNION ALL
      (
        SELECT 
          'course' as source_type,
          cr.id,
          cr.title,
          cr.description,
          cr.file_path,
          cr.file_size,
          cr.file_type,
          cr.url,
          cr.created_at,
          'Recurso del Curso' as lesson_title,
          u.name as user_name
        FROM course_resources cr
        LEFT JOIN users u ON cr.created_by = u.id
        WHERE cr.course_id = ?
      )
      ORDER BY created_at DESC
    `, [courseId, courseId]);

    // Obtener quizzes del curso
    const quizzes = await query(`
      SELECT 
        q.*,
        COUNT(DISTINCT qq.id) as total_preguntas,
        COUNT(DISTINCT qr.user_id) as estudiantes_completaron,
        AVG(qr.score) as puntuacion_promedio
      FROM quizzes q
      LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
      LEFT JOIN quiz_results qr ON q.id = qr.quiz_id
      WHERE q.course_id = ?
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `, [courseId]);

    // Obtener estadísticas del curso
    const stats = await queryOne(`
      SELECT 
        COUNT(DISTINCT uc.user_id) as total_inscritos,
        COUNT(DISTINCT CASE WHEN uc.completed = 1 THEN uc.user_id END) as completados,
        AVG(uc.progress) as progreso_promedio,
        COUNT(DISTINCT l.id) as total_lecciones,
        COUNT(DISTINCT ul.lesson_id) as lecciones_completadas_total
      FROM courses c
      LEFT JOIN user_courses uc ON c.id = uc.course_id
      LEFT JOIN lessons l ON c.id = l.course_id
      LEFT JOIN user_lessons ul ON l.id = ul.lesson_id AND ul.completed = 1
      WHERE c.id = ?
    `, [courseId]);

    return NextResponse.json({
      success: true,
      data: {
        course: {
          ...course,
          progreso_promedio: Math.round(course.progreso_promedio || 0),
        },
        lessons,
        students,
        resources,
        quizzes: quizzes.map((q: any) => ({
          ...q,
          puntuacion_promedio: q.puntuacion_promedio ? Math.round(q.puntuacion_promedio * 10) / 10 : 0,
        })),
        stats: {
          ...stats,
          progreso_promedio: Math.round(stats?.progreso_promedio || 0),
        },
      }
    });

  } catch (error) {
    console.error('Error fetching professor course:', error);
    return NextResponse.json(
      { error: 'Error al obtener el curso' },
      { status: 500 }
    );
  }
}

