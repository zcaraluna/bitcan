import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
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

    const course = await queryOne(`
      SELECT 
        c.id, c.title, c.short_description, c.description, c.identifier, c.status,
        c.category_id, c.level,
        c.enrollment_start_date, c.enrollment_end_date,
        c.course_start_date, c.course_end_date,
        c.duration_hours, c.duration_minutes, c.price, c.price_pyg, c.is_free,
        c.exchange_rate_usd, c.exchange_rate_ars, c.exchange_rate_brl,
        c.max_students, c.requires_approval, c.is_featured, c.is_published, c.sort_order,
        c.requirements, c.learning_objectives, c.thumbnail_url, c.video_url,
        c.payment_bank, c.payment_account, c.payment_holder, c.payment_id, c.payment_ruc, c.payment_alias, c.payment_whatsapp,
        c.payment_crypto_wallet, c.payment_crypto_network, c.payment_crypto_currency,
        COUNT(DISTINCT uc.user_id) as total_students,
        COUNT(DISTINCT l.id) as total_lessons,
        GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') as instructors
      FROM courses c
      LEFT JOIN course_instructors ci ON c.id = ci.course_id
      LEFT JOIN users u ON ci.instructor_id = u.id
      LEFT JOIN user_courses uc ON c.id = uc.course_id
      LEFT JOIN lessons l ON c.id = l.course_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [params.id]);

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      course
    });

  } catch (error) {
    console.error('Error fetching course details:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}




