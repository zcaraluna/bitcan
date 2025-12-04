import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Obtener cursos más populares
    const coursesQuery = `
      SELECT c.id, c.title, c.description,
             COUNT(uc.user_id) as total_estudiantes,
             AVG(progreso.progreso_promedio) as progreso_promedio
      FROM courses c
      LEFT JOIN user_courses uc ON c.id = uc.course_id
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
      GROUP BY c.id
      ORDER BY total_estudiantes DESC
      LIMIT 5
    `;

    const courses = await query(coursesQuery);

    return NextResponse.json({
      success: true,
      courses: courses
    });

  } catch (error) {
    console.error('Error fetching popular courses:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





