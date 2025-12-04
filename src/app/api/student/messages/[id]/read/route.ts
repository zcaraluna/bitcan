import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'estudiante') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const messageId = parseInt(params.id);
    const userId = decoded.id;

    // Marcar como leído en messages
    // Primero verificamos que el usuario sea destinatario del mensaje
    await query(`
      UPDATE messages m
      JOIN message_recipients mr ON m.id = mr.message_id
      SET m.is_read = 1
      WHERE m.id = ? AND mr.user_id = ?
    `, [messageId, userId]);

    return NextResponse.json({ 
      success: true, 
      message: 'Mensaje marcado como leído' 
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: 'Error al marcar mensaje como leído' },
      { status: 500 }
    );
  }
}

