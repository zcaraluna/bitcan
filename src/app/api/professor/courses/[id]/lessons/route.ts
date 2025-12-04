import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function POST(
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
        { error: 'No tienes permisos para crear lecciones en este curso' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      content,
      duration_minutes,
      video_url,
      sort_order
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      );
    }

    // Obtener el siguiente sort_order si no se proporciona
    let finalSortOrder = sort_order;
    if (!finalSortOrder) {
      const maxOrder = await queryOne(`
        SELECT COALESCE(MAX(sort_order), 0) as max_order
        FROM lessons
        WHERE course_id = ?
      `, [courseId]);
      finalSortOrder = (maxOrder?.max_order || 0) + 1;
    }

    // Crear la lección
    const result = await query(`
      INSERT INTO lessons (
        course_id, title, description, content, duration_minutes, video_url, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      courseId,
      title.trim(),
      description?.trim() || null,
      content?.trim() || null,
      duration_minutes ? parseInt(String(duration_minutes)) : null,
      video_url?.trim() || null,
      finalSortOrder
    ]);

    const lessonId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      message: 'Lección creada exitosamente',
      data: {
        lesson_id: lessonId
      }
    });

  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Error al crear la lección' },
      { status: 500 }
    );
  }
}

