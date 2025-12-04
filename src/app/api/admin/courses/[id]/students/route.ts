import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const students = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        uc.started_at,
        uc.completed,
        uc.completed_at,
        uc.progress,
        (SELECT COUNT(*) FROM user_lessons ul 
         JOIN lessons l ON ul.lesson_id = l.id 
         WHERE ul.user_id = u.id AND l.course_id = ? AND ul.completed = 1) as lessons_completed,
        (SELECT COUNT(*) FROM lessons WHERE course_id = ?) as total_lessons
      FROM users u
      JOIN user_courses uc ON u.id = uc.user_id
      WHERE uc.course_id = ?
      ORDER BY uc.started_at DESC
    `, [params.id, params.id, params.id]);

    return NextResponse.json({
      success: true,
      students
    });

  } catch (error) {
    console.error('Error fetching course students:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}






