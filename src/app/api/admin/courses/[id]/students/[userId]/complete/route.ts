import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const courseId = parseInt(params.id);
    const userId = parseInt(params.userId);
    const body = await request.json();
    const { completed } = body;

    // Verificar que el estudiante esté inscrito en el curso
    const enrollment = await queryOne(`
      SELECT id FROM user_courses
      WHERE user_id = ? AND course_id = ?
    `, [userId, courseId]);

    if (!enrollment) {
      return NextResponse.json(
        { error: 'El estudiante no está inscrito en este curso' },
        { status: 404 }
      );
    }

    // Actualizar el estado de completitud
    if (completed) {
      await query(`
        UPDATE user_courses
        SET completed = 1, completed_at = NOW(), progress = 100
        WHERE user_id = ? AND course_id = ?
      `, [userId, courseId]);
    } else {
      await query(`
        UPDATE user_courses
        SET completed = 0, completed_at = NULL
        WHERE user_id = ? AND course_id = ?
      `, [userId, courseId]);
    }

    return NextResponse.json({
      success: true,
      message: completed ? 'Curso marcado como completado' : 'Curso desmarcado como completado'
    });

  } catch (error) {
    console.error('Error updating course completion:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el estado del curso' },
      { status: 500 }
    );
  }
}

