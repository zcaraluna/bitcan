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
    if (!decoded || decoded.role !== 'estudiante') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const userId = decoded.id;

    // Obtener cursos publicados con información de si el estudiante está inscrito
    const courses = await query(`
      SELECT 
        c.id,
        c.title,
        c.short_description,
        c.description,
        c.duration_hours,
        c.duration_minutes,
        c.thumbnail_url,
        c.level,
        c.is_free,
        c.price,
        c.price_pyg,
        c.exchange_rate_usd,
        c.exchange_rate_ars,
        c.exchange_rate_brl,
        c.requires_approval,
        c.payment_bank,
        c.payment_account,
        c.payment_holder,
        c.payment_id,
        c.payment_ruc,
        c.payment_alias,
        c.payment_whatsapp,
        c.payment_crypto_wallet,
        c.payment_crypto_network,
        c.payment_crypto_currency,
        cat.name as category_name,
        (SELECT COUNT(*) FROM user_courses WHERE course_id = c.id) as students_count,
        (SELECT GROUP_CONCAT(u.name SEPARATOR ', ') 
         FROM course_instructors ci 
         JOIN users u ON ci.instructor_id = u.id 
         WHERE ci.course_id = c.id) as instructor,
        (SELECT COUNT(*) FROM user_courses WHERE course_id = c.id AND user_id = ?) as is_enrolled,
        (SELECT status FROM course_applications WHERE course_id = c.id AND user_id = ? LIMIT 1) as application_status
      FROM courses c
      LEFT JOIN course_categories cat ON c.category_id = cat.id
      WHERE c.is_published = 1
      ORDER BY c.created_at DESC
    `, [userId, userId]);

    // Convertir is_enrolled a boolean y agregar estado de aplicación
    const coursesWithEnrollment = (courses as any[]).map(course => ({
      ...course,
      is_enrolled: course.is_enrolled > 0,
      has_pending_application: course.application_status === 'pending',
      application_rejected: course.application_status === 'rejected'
    }));

    return NextResponse.json({
      success: true,
      data: coursesWithEnrollment
    });

  } catch (error) {
    console.error('Error fetching available courses:', error);
    return NextResponse.json(
      { error: 'Error al obtener cursos disponibles' },
      { status: 500 }
    );
  }
}

