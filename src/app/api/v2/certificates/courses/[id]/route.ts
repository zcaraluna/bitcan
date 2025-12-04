import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryOne } from '@/lib/db';

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

    const courseId = parseInt(params.id);

    // Obtener curso con instructores
    const course = await queryOne(`
      SELECT 
        c.*,
        GROUP_CONCAT(u.name SEPARATOR ', ') as instructors
      FROM courses c
      LEFT JOIN course_instructors ci ON c.id = ci.course_id
      LEFT JOIN users u ON ci.instructor_id = u.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [courseId]);

    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course
    });

  } catch (error) {
    console.error('Error getting course:', error);
    return NextResponse.json(
      { error: 'Error al obtener curso' },
      { status: 500 }
    );
  }
}







