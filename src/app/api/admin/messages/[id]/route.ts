import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// DELETE - Eliminar mensaje
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
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    if (type === 'inbox') {
      // Marcar como eliminado por el destinatario
      await query(
        'UPDATE messages SET is_deleted_by_recipient = 1 WHERE id = ?',
        [params.id]
      );
    } else {
      // Marcar como eliminado por el remitente
      await query(
        'UPDATE messages SET is_deleted_by_sender = 1 WHERE id = ?',
        [params.id]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














