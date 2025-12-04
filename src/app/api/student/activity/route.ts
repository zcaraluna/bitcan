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

    // Obtener actividad reciente del estudiante
    const activity = await query(`
      (
        SELECT 
          'lesson_completed' as type,
          'Lección completada' COLLATE utf8mb4_unicode_ci as title,
          CONCAT('Completaste "', l.title, '" de ', c.title) COLLATE utf8mb4_unicode_ci as description,
          ul.completed_at as created_at,
          'green' COLLATE utf8mb4_unicode_ci as color,
          'BookOpen' COLLATE utf8mb4_unicode_ci as icon
        FROM user_lessons ul
        JOIN lessons l ON ul.lesson_id = l.id
        JOIN courses c ON l.course_id = c.id
        WHERE ul.user_id = ? AND ul.completed = 1
        ORDER BY ul.completed_at DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT 
          'quiz_completed' as type,
          'Quiz completado' COLLATE utf8mb4_unicode_ci as title,
          CONCAT('Calificación: ', qr.score, '/100 - ', c.title) COLLATE utf8mb4_unicode_ci as description,
          qr.completed_at as created_at,
          'blue' COLLATE utf8mb4_unicode_ci as color,
          'FileText' COLLATE utf8mb4_unicode_ci as icon
        FROM quiz_results qr
        JOIN quizzes q ON qr.quiz_id = q.id
        JOIN courses c ON q.course_id = c.id
        WHERE qr.user_id = ?
        ORDER BY qr.completed_at DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT 
          'course_completed' as type,
          'Curso completado' COLLATE utf8mb4_unicode_ci as title,
          CONCAT('Completaste el curso "', c.title, '"') COLLATE utf8mb4_unicode_ci as description,
          uc.completed_at as created_at,
          'purple' COLLATE utf8mb4_unicode_ci as color,
          'Award' COLLATE utf8mb4_unicode_ci as icon
        FROM user_courses uc
        JOIN courses c ON uc.course_id = c.id
        WHERE uc.user_id = ? AND uc.completed_at IS NOT NULL
        ORDER BY uc.completed_at DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT 
          'certificate_issued' as type,
          'Certificado obtenido' COLLATE utf8mb4_unicode_ci as title,
          CONCAT('Certificado emitido para "', c.title, '"') COLLATE utf8mb4_unicode_ci as description,
          cert.issue_date as created_at,
          'green' COLLATE utf8mb4_unicode_ci as color,
          'Award' COLLATE utf8mb4_unicode_ci as icon
        FROM certificates cert
        JOIN courses c ON cert.course_id = c.id
        WHERE cert.user_id = ? AND cert.status = 'issued'
        ORDER BY cert.issue_date DESC
        LIMIT 5
      )
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId, userId, userId, userId]);

    return NextResponse.json({
      success: true,
      data: activity
    });

  } catch (error) {
    console.error('Error fetching student activity:', error);
    return NextResponse.json(
      { error: 'Error al obtener actividad del estudiante' },
      { status: 500 }
    );
  }
}

