import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'profesor') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const userId = decoded.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'inbox';

    let messages;
    let unreadCount = 0;

    if (type === 'inbox') {
      // Mensajes recibidos
      messages = await query(`
        SELECT 
          m.*,
          u.name as sender_name,
          u.email as sender_email,
          u.role as sender_role,
          COUNT(ma.id) as attachment_count
        FROM messages m
        JOIN message_recipients mr ON m.id = mr.message_id
        JOIN users u ON m.sender_id = u.id
        LEFT JOIN message_attachments ma ON m.id = ma.message_id
        WHERE mr.user_id = ? AND m.is_deleted_by_recipient = 0
        GROUP BY m.id
        ORDER BY m.is_read ASC, m.created_at DESC
      `, [userId]);

      // Contar no leídos
      const unreadResult = await queryOne(`
        SELECT COUNT(*) as count
        FROM messages m
        JOIN message_recipients mr ON m.id = mr.message_id
        WHERE mr.user_id = ? AND m.is_read = 0 AND m.is_deleted_by_recipient = 0
      `, [userId]);
      unreadCount = unreadResult?.count || 0;
    } else {
      // Mensajes enviados
      messages = await query(`
        SELECT 
          m.*,
          GROUP_CONCAT(u.name SEPARATOR ', ') as recipient_names,
          GROUP_CONCAT(u.email SEPARATOR ', ') as recipient_emails,
          GROUP_CONCAT(u.role SEPARATOR ', ') as recipient_roles,
          COUNT(ma.id) as attachment_count
        FROM messages m
        JOIN message_recipients mr ON m.id = mr.message_id
        JOIN users u ON mr.user_id = u.id
        LEFT JOIN message_attachments ma ON m.id = ma.message_id
        WHERE m.sender_id = ? AND m.is_deleted_by_sender = 0
        GROUP BY m.id
        ORDER BY m.created_at DESC
      `, [userId]);
    }

    return NextResponse.json({
      success: true,
      data: messages,
      unread_count: unreadCount,
    });

  } catch (error) {
    console.error('Error fetching professor messages:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}

