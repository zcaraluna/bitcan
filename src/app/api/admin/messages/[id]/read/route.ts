import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// PATCH - Marcar mensaje como leído
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Marcar como leído
    await query(`
      UPDATE message_recipients 
      SET is_read = 1, read_at = NOW()
      WHERE message_id = ? AND user_id = ?
    `, [params.id, decoded.id.toString()]);

    return NextResponse.json({
      success: true,
      message: 'Mensaje marcado como leído'
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


