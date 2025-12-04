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

    const applications = await query(`
      SELECT 
        ca.id,
        ca.user_id,
        ca.status,
        ca.application_date,
        u.name as user_name,
        u.email as user_email
      FROM course_applications ca
      JOIN users u ON ca.user_id = u.id
      WHERE ca.course_id = ?
      ORDER BY 
        CASE ca.status 
          WHEN 'pending' THEN 1 
          WHEN 'approved' THEN 2 
          WHEN 'rejected' THEN 3 
        END,
        ca.application_date DESC
    `, [params.id]);

    return NextResponse.json({
      success: true,
      applications
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
