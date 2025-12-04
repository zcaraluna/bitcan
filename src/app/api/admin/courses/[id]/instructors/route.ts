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

    const courseId = params.id;

    const instructors = await query(`
      SELECT u.id, u.name, u.email, ci.role, ci.is_lead_instructor
      FROM course_instructors ci
      JOIN users u ON ci.instructor_id = u.id
      WHERE ci.course_id = ?
      ORDER BY ci.is_lead_instructor DESC, u.name ASC
    `, [courseId]);

    return NextResponse.json({
      success: true,
      instructors
    });

  } catch (error) {
    console.error('Error fetching course instructors:', error);
    return NextResponse.json(
      { error: 'Error al obtener instructores del curso' },
      { status: 500 }
    );
  }
}

