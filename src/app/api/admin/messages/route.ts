import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener mensajes (inbox o sent)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'inbox';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let messages;
    let totalMessages;

    if (type === 'inbox') {
      // Mensajes recibidos
      totalMessages = 0;
      messages = await query(`
        SELECT DISTINCT
          m.id,
          m.sender_id,
          m.subject,
          m.message,
          m.created_at,
          m.is_read,
          m.parent_message_id,
          s.name as sender_name,
          s.email as sender_email,
          s.role as sender_role
        FROM messages m
        JOIN message_recipients mr ON m.id = mr.message_id
        JOIN users s ON m.sender_id = s.id
        WHERE mr.user_id = ?
        ORDER BY m.created_at DESC
        LIMIT 20
      `, [decoded.id]);
    } else {
      // Mensajes enviados
      totalMessages = 0;
      messages = await query(`
        SELECT 
          m.id,
          m.sender_id,
          m.subject,
          m.message,
          m.created_at,
          m.is_read,
          m.parent_message_id,
          u.name as sender_name,
          u.email as sender_email,
          u.role as sender_role,
          GROUP_CONCAT(DISTINCT rec.name ORDER BY rec.name SEPARATOR ', ') as recipients
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        LEFT JOIN message_recipients mr ON m.id = mr.message_id
        LEFT JOIN users rec ON mr.user_id = rec.id
        WHERE m.sender_id = ?
        GROUP BY m.id, m.sender_id, m.subject, m.message, m.created_at, m.is_read, m.parent_message_id, u.name, u.email, u.role
        ORDER BY m.created_at DESC
        LIMIT 20
      `, [decoded.id]);
    }

    const totalPages = Math.ceil(totalMessages / limit);

    return NextResponse.json({
      success: true,
      messages,
      totalPages,
      currentPage: page
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Enviar mensaje
export async function POST(request: NextRequest) {
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
    const { recipient_ids, subject, message, parent_message_id } = body;

    // Validaciones
    if (!recipient_ids || recipient_ids.length === 0) {
      return NextResponse.json(
        { error: 'Debes seleccionar al menos un destinatario' },
        { status: 400 }
      );
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'El asunto y el mensaje son obligatorios' },
        { status: 400 }
      );
    }

    // Insertar mensaje
    const result = await query(`
      INSERT INTO messages (sender_id, subject, message, parent_message_id, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [decoded.id, subject, message, parent_message_id || null]);

    const messageId = (result as any).insertId;

    // Insertar destinatarios
    for (const recipientId of recipient_ids) {
      await query(`
        INSERT INTO message_recipients (message_id, user_id, created_at)
        VALUES (?, ?, NOW())
      `, [messageId, recipientId]);
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      id: messageId
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


