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
    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '10');

    // Obtener estudiantes recientes
    // LIMIT debe ser un valor literal, no un parámetro
    const students = await query(`
      SELECT 
        u.name, 
        u.email, 
        c.title as curso, 
        uc.started_at
      FROM user_courses uc
      JOIN users u ON uc.user_id = u.id
      JOIN courses c ON uc.course_id = c.id
      JOIN course_instructors ci ON c.id = ci.course_id
      WHERE ci.instructor_id = ?
      ORDER BY uc.started_at DESC
      LIMIT ${limit}
    `, [instructorId]);

    return NextResponse.json({
      success: true,
      data: students,
    });

  } catch (error) {
    console.error('Error fetching recent students:', error);
    return NextResponse.json(
      { error: 'Error al obtener estudiantes recientes' },
      { status: 500 }
    );
  }
}

