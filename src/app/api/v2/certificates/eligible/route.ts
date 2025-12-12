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
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');

    if (!courseId) {
      return NextResponse.json(
        { error: 'course_id es requerido' },
        { status: 400 }
      );
    }

    // Obtener estudiantes que completaron el curso (100% progreso) y no tienen certificado
    // Excluir estudiantes que ya tienen un certificado emitido para este curso
    const students = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        uc.started_at as enrollment_date,
        uc.completed_at,
        uc.progress as progress_percentage,
        0 as has_certificate
      FROM users u
      INNER JOIN user_courses uc ON u.id = uc.user_id
      WHERE uc.course_id = ? 
        AND (uc.completed_at IS NOT NULL OR uc.progress >= 100)
        AND u.role = 'estudiante'
        AND NOT EXISTS (
          SELECT 1 FROM certificates c 
          WHERE c.user_id = u.id 
            AND c.course_id = uc.course_id 
            AND c.status = 'issued'
            AND (c.certificate_type = 'course' OR c.certificate_type IS NULL)
        )
      ORDER BY uc.completed_at DESC, u.name ASC
    `, [courseId]);

    return NextResponse.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Error getting eligible students:', error);
    return NextResponse.json(
      { error: 'Error al obtener estudiantes elegibles' },
      { status: 500 }
    );
  }
}

