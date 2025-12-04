import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; appId: string } }
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

    await query(
      "UPDATE course_applications SET status = 'rejected', reviewed_at = NOW(), reviewed_by = ? WHERE id = ?",
      [decoded.id, params.appId]
    );

    return NextResponse.json({
      success: true,
      message: 'Postulación rechazada'
    });

  } catch (error) {
    console.error('Error rejecting application:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














