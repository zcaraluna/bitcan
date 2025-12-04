import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener cursos más populares
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Obtener cursos más populares
    const courses = await query(`
      SELECT 
        c.id,
        c.title,
        COUNT(DISTINCT uc.user_id) as estudiantes,
        COUNT(DISTINCT CASE WHEN uc.completed = 1 THEN uc.user_id END) as completados,
        GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') as instructor_name
      FROM courses c
      LEFT JOIN user_courses uc ON c.id = uc.course_id
      LEFT JOIN course_instructors ci ON c.id = ci.course_id
      LEFT JOIN users u ON ci.instructor_id = u.id
      GROUP BY c.id, c.title
      ORDER BY estudiantes DESC, completados DESC
      LIMIT ?
    `, [limit.toString()]);

    return NextResponse.json({
      success: true,
      courses
    });

  } catch (error) {
    console.error('Error fetching popular courses:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














