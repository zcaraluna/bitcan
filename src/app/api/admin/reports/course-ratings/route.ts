import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener calificaciones promedio por curso
    const ratings = await query(`
      SELECT 
        c.id,
        c.title,
        COUNT(cr.id) as total_ratings,
        AVG(cr.professor_rating) as avg_professor_rating,
        AVG(cr.platform_rating) as avg_platform_rating,
        AVG(cr.course_rating) as avg_course_rating,
        GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') as instructor_name
      FROM courses c
      LEFT JOIN course_ratings cr ON c.id = cr.course_id
      LEFT JOIN course_instructors ci ON c.id = ci.course_id
      LEFT JOIN users u ON ci.instructor_id = u.id
      GROUP BY c.id, c.title
      HAVING total_ratings > 0
      ORDER BY avg_course_rating DESC, total_ratings DESC
    `);

    return NextResponse.json({
      success: true,
      ratings: ratings.map((r: any) => ({
        ...r,
        avg_professor_rating: r.avg_professor_rating ? parseFloat(r.avg_professor_rating).toFixed(1) : null,
        avg_platform_rating: r.avg_platform_rating ? parseFloat(r.avg_platform_rating).toFixed(1) : null,
        avg_course_rating: r.avg_course_rating ? parseFloat(r.avg_course_rating).toFixed(1) : null,
      }))
    });

  } catch (error) {
    console.error('Error fetching course ratings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

