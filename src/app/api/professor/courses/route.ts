import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const offset = (page - 1) * perPage;

    // Obtener total de cursos para paginación
    const totalResult = await queryOne(`
      SELECT COUNT(DISTINCT c.id) as total
      FROM courses c
      JOIN course_instructors ci ON c.id = ci.course_id
      WHERE ci.instructor_id = ?
    `, [instructorId]);

    const total = totalResult?.total || 0;
    const totalPages = Math.ceil(total / perPage);

    // Obtener cursos donde el profesor es instructor (con paginación)
    // LIMIT y OFFSET deben ser valores literales, no parámetros
    const courses = await query(`
      SELECT 
        c.*, 
        COUNT(DISTINCT uc.user_id) as total_estudiantes,
        COUNT(DISTINCT l.id) as total_lecciones,
        COALESCE(AVG(progreso.progreso_promedio), 0) as progreso_promedio
      FROM courses c
      JOIN course_instructors ci ON c.id = ci.course_id
      LEFT JOIN user_courses uc ON c.id = uc.course_id
      LEFT JOIN lessons l ON c.id = l.course_id
      LEFT JOIN (
        SELECT course_id, AVG(
          (SELECT COUNT(*) FROM user_lessons ul 
           JOIN lessons l ON ul.lesson_id = l.id 
           WHERE l.course_id = uc2.course_id AND ul.user_id = uc2.user_id AND ul.completed = 1) * 100.0 /
          (SELECT COUNT(*) FROM lessons l2 WHERE l2.course_id = uc2.course_id)
        ) as progreso_promedio
        FROM user_courses uc2
        GROUP BY course_id
      ) progreso ON c.id = progreso.course_id
      WHERE ci.instructor_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `, [instructorId]);

    return NextResponse.json({
      success: true,
      data: courses.map((c: any) => ({
        ...c,
        progreso_promedio: Math.round(c.progreso_promedio || 0),
      })),
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
      }
    });

  } catch (error) {
    console.error('Error fetching professor courses:', error);
    return NextResponse.json(
      { error: 'Error al obtener cursos' },
      { status: 500 }
    );
  }
}

