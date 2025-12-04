import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

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

    // Obtener cursos del estudiante con información detallada
    const courses = await query(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.short_description,
        c.duration_hours,
        c.duration_minutes,
        c.thumbnail_url as image_url,
        c.level,
        uc.started_at,
        uc.completed_at,
        uc.progress,
        uc.completed as course_completed,
        (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
        (SELECT COUNT(*) FROM user_lessons ul 
         JOIN lessons l ON ul.lesson_id = l.id 
         WHERE l.course_id = c.id AND ul.user_id = ? AND ul.completed = 1) as completed_lessons,
        (SELECT COUNT(*) FROM quizzes WHERE course_id = c.id) as total_quizzes,
        (SELECT COUNT(*) FROM quiz_results qr 
         JOIN quizzes q ON qr.quiz_id = q.id 
         WHERE q.course_id = c.id AND qr.user_id = ?) as completed_quizzes,
        (SELECT COUNT(*) FROM certificates WHERE user_id = ? AND course_id = c.id AND status = 'issued') as has_certificate,
        (SELECT COUNT(*) FROM user_courses WHERE course_id = c.id) as students_count,
        (SELECT GROUP_CONCAT(u.name SEPARATOR ', ') 
         FROM course_instructors ci 
         JOIN users u ON ci.instructor_id = u.id 
         WHERE ci.course_id = c.id) as instructor
      FROM user_courses uc
      JOIN courses c ON uc.course_id = c.id
      WHERE uc.user_id = ?
      ORDER BY uc.started_at DESC
    `, [userId, userId, userId, userId]);

    return NextResponse.json({
      success: true,
      data: courses
    });

  } catch (error) {
    console.error('Error fetching student courses:', error);
    return NextResponse.json(
      { error: 'Error al obtener cursos del estudiante' },
      { status: 500 }
    );
  }
}

