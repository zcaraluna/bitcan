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
    if (!decoded || decoded.role !== 'profesor') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const instructorId = decoded.id;
    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '15');

    // Obtener actividad reciente
    // LIMIT debe ser un valor literal, no un parámetro
    const activity = await query(`
      (
        SELECT 
          'inscripcion' as tipo,
          u.name as estudiante,
          c.title as curso,
          uc.started_at as fecha
        FROM user_courses uc
        JOIN users u ON uc.user_id = u.id
        JOIN courses c ON uc.course_id = c.id
        JOIN course_instructors ci ON c.id = ci.course_id
        WHERE ci.instructor_id = ?
      )
      UNION ALL
      (
        SELECT 
          'completado' as tipo,
          u.name as estudiante,
          c.title as curso,
          ul.completed_at as fecha
        FROM user_lessons ul
        JOIN lessons l ON ul.lesson_id = l.id
        JOIN courses c ON l.course_id = c.id
        JOIN users u ON ul.user_id = u.id
        JOIN course_instructors ci ON c.id = ci.course_id
        WHERE ci.instructor_id = ? AND ul.completed = 1
      )
      ORDER BY fecha DESC
      LIMIT ${limit}
    `, [instructorId, instructorId]);

    return NextResponse.json({
      success: true,
      data: activity,
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Error al obtener actividad reciente' },
      { status: 500 }
    );
  }
}

