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

    // Obtener estudiantes que NO están inscritos en este curso
    const students = await query(`
      SELECT u.id, u.name, u.email
      FROM users u
      WHERE u.role = 'estudiante'
        AND u.is_active = 1
        AND u.id NOT IN (
          SELECT user_id FROM user_courses WHERE course_id = ?
        )
      ORDER BY u.name
    `, [params.id]);

    return NextResponse.json({
      success: true,
      students
    });

  } catch (error) {
    console.error('Error fetching available students:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














