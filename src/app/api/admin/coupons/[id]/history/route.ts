import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener historial de uso de un cupón
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

    // Obtener historial de uso
    const history = await query(`
      SELECT 
        cu.id,
        cu.used_at,
        u.name as user_name,
        u.email as user_email,
        c.title as course_title
      FROM coupon_usage cu
      JOIN users u ON cu.user_id = u.id
      LEFT JOIN courses c ON cu.course_id = c.id
      WHERE cu.coupon_id = ?
      ORDER BY cu.used_at DESC
    `, [params.id]);

    return NextResponse.json({
      success: true,
      history
    });

  } catch (error) {
    console.error('Error fetching coupon history:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














