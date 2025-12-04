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
    if (!decoded || decoded.role !== 'profesor') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const instructorId = decoded.id;
    const courseId = parseInt(params.id);
    const lessonId = parseInt(params.lessonId);

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

    // Obtener información de la lección
    const lesson = await queryOne(`
      SELECT 
        l.id,
        l.title,
        l.description,
        l.content,
        l.video_url,
        l.duration_minutes,
        l.sort_order,
        l.course_id,
        c.title as course_title
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE l.id = ? AND l.course_id = ?
    `, [lessonId, courseId]);

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada' },
        { status: 404 }
      );
    }

    // Obtener recursos de la lección
    const resources = await query(`
      SELECT 
        lr.id,
        lr.title,
        lr.description,
        lr.file_url,
        lr.file_type,
        lr.file_size,
        lr.sort_order
      FROM lesson_resources lr
      WHERE lr.lesson_id = ?
      ORDER BY lr.sort_order ASC, lr.created_at ASC
    `, [lessonId]);

    return NextResponse.json({
      success: true,
      data: {
        lesson,
        resources
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

