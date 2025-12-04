import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
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
    const lessonId = parseInt(params.lessonId);

    // Verificar que el estudiante esté inscrito en el curso de la lección
    const lesson = await queryOne(`
      SELECT 
        l.*, 
        c.title as course_title, 
        c.id as course_id,
        uc.progress as course_progress,
        uc.completed as course_completed
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      JOIN user_courses uc ON c.id = uc.course_id
      WHERE l.id = ? AND uc.user_id = ?
    `, [lessonId, userId]);

    if (!lesson) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta lección' },
        { status: 403 }
      );
    }

    // Obtener progreso de la lección
    const lessonProgress = await queryOne(`
      SELECT 
        completed, 
        completed_at, 
        time_watched,
        started_at
      FROM user_lessons 
      WHERE lesson_id = ? AND user_id = ?
    `, [lessonId, userId]);

    // Obtener recursos de la lección
    const resources = await query(`
      SELECT 
        id,
        title,
        description,
        file_url,
        file_type,
        file_size,
        is_downloadable,
        sort_order
      FROM lesson_resources
      WHERE lesson_id = ?
      ORDER BY sort_order ASC
    `, [lessonId]);

    // Obtener todas las lecciones del curso para navegación
    const allLessons = await query(`
      SELECT 
        l.id, 
        l.title, 
        l.sort_order,
        CASE WHEN ul.completed = 1 THEN 1 ELSE 0 END as completed
      FROM lessons l
      LEFT JOIN user_lessons ul ON l.id = ul.lesson_id AND ul.user_id = ?
      WHERE l.course_id = ?
      ORDER BY l.sort_order ASC
    `, [userId, courseId]);

    // Encontrar lección anterior y siguiente
    const currentIndex = allLessons.findIndex((l: any) => l.id === lessonId);
    const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    return NextResponse.json({
      success: true,
      data: {
        lesson: {
          ...lesson,
          progress: lessonProgress || null
        },
        resources,
        allLessons,
        previousLesson,
        nextLesson
      }
    });

  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Error al obtener la lección' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
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
    const lessonId = parseInt(params.lessonId);

    const body = await request.json();
    const { mark_completed } = body;

    if (!mark_completed) {
      return NextResponse.json(
        { error: 'Acción no válida' },
        { status: 400 }
      );
    }

    // Verificar que el estudiante esté inscrito
    const enrollment = await queryOne(`
      SELECT completed FROM user_courses
      WHERE user_id = ? AND course_id = ?
    `, [userId, courseId]);

    if (!enrollment) {
      return NextResponse.json(
        { error: 'No estás inscrito en este curso' },
        { status: 403 }
      );
    }

    // Verificar si ya está completada
    const existingProgress = await queryOne(`
      SELECT completed FROM user_lessons
      WHERE lesson_id = ? AND user_id = ?
    `, [lessonId, userId]);

    if (existingProgress && existingProgress.completed) {
      return NextResponse.json({
        success: true,
        message: 'La lección ya estaba completada'
      });
    }

    // Marcar como completada
    await query(`
      INSERT INTO user_lessons (user_id, lesson_id, course_id, completed, completed_at) 
      VALUES (?, ?, ?, 1, NOW())
      ON DUPLICATE KEY UPDATE completed = 1, completed_at = NOW()
    `, [userId, lessonId, courseId]);

    // Actualizar progreso del curso
    const courseProgress = await queryOne(`
      SELECT 
        COUNT(*) as total_lessons,
        COUNT(CASE WHEN ul.completed = 1 THEN 1 END) as completed_lessons
      FROM lessons l
      LEFT JOIN user_lessons ul ON l.id = ul.lesson_id AND ul.user_id = ?
      WHERE l.course_id = ?
    `, [userId, courseId]);

    const newProgress = courseProgress.total_lessons > 0
      ? Math.round((courseProgress.completed_lessons / courseProgress.total_lessons) * 100 * 10) / 10
      : 0;

    // Si el progreso es 100% y el curso no está marcado como completado, marcarlo
    const isCompleted = newProgress >= 100;
    const updateQuery = isCompleted && !enrollment.completed
      ? `UPDATE user_courses 
         SET progress = ?, completed = 1, completed_at = NOW(), last_accessed = NOW()
         WHERE user_id = ? AND course_id = ?`
      : `UPDATE user_courses 
         SET progress = ?, last_accessed = NOW()
         WHERE user_id = ? AND course_id = ?`;

    await query(updateQuery, [newProgress, userId, courseId]);

    return NextResponse.json({
      success: true,
      message: 'Lección marcada como completada',
      progress: newProgress
    });

  } catch (error) {
    console.error('Error marking lesson as completed:', error);
    return NextResponse.json(
      { error: 'Error al marcar la lección como completada' },
      { status: 500 }
    );
  }
}

