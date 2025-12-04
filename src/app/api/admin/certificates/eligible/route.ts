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

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');

    if (!courseId) {
      return NextResponse.json({ error: 'ID de curso requerido' }, { status: 400 });
    }

    // Obtener estudiantes que han completado el curso
    const eligibleStudents = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        uc.completed_at,
        CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as has_certificate
      FROM user_courses uc
      JOIN users u ON uc.user_id = u.id
      LEFT JOIN certificates c ON uc.user_id = c.user_id AND uc.course_id = c.course_id 
        AND (c.certificate_type = 'course' OR c.certificate_type IS NULL)
      WHERE uc.course_id = ? AND uc.completed_at IS NOT NULL
      ORDER BY u.name
    `, [courseId]);

    return NextResponse.json({
      success: true,
      students: eligibleStudents
    });

  } catch (error) {
    console.error('Error fetching eligible students:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}