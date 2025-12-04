import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
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

    const certificateId = params.id;

    // Revocar certificado (cambiar status a 'revoked')
    const result = await query(`
      UPDATE certificates 
      SET status = 'revoked', updated_at = NOW()
      WHERE id = ? AND status = 'issued'
    `, [certificateId]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Certificado no encontrado o ya revocado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Certificado revocado exitosamente'
    });

  } catch (error) {
    console.error('Error revoking certificate:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}