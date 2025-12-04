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

    // Obtener mensajes recibidos por el estudiante
    const messages = await query(`
      SELECT DISTINCT
        m.id,
        m.subject,
        m.message as content,
        m.created_at,
        m.is_read,
        s.name as sender_name,
        s.role as sender_role
      FROM messages m
      JOIN message_recipients mr ON m.id = mr.message_id
      JOIN users s ON m.sender_id = s.id
      WHERE mr.user_id = ?
      ORDER BY m.created_at DESC
      LIMIT 50
    `, [userId]);

    return NextResponse.json({ 
      success: true, 
      data: messages 
    });
  } catch (error) {
    console.error('Error fetching student messages:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes del estudiante' },
      { status: 500 }
    );
  }
}

