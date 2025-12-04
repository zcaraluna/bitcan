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
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const messageId = params.id;

    // Obtener archivos adjuntos del mensaje
    const attachments = await query(`
      SELECT 
        id,
        file_name,
        file_path,
        file_size,
        file_type,
        original_name,
        created_at
      FROM message_attachments
      WHERE message_id = ?
      ORDER BY created_at ASC
    `, [messageId]);

    return NextResponse.json({
      success: true,
      attachments: attachments
    });

  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



