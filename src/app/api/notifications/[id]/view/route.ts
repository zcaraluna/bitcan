import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// POST - Marcar notificación como vista
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
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const userId = decoded.id;
    const notificationId = params.id;

    // Verificar si ya existe un registro de vista
    const existing = await queryOne(
      'SELECT id FROM notification_views WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (existing) {
      // Actualizar
      await query(
        'UPDATE notification_views SET viewed_at = NOW() WHERE notification_id = ? AND user_id = ?',
        [notificationId, userId]
      );
    } else {
      // Crear nuevo - intentar primero, si falla por FK, ignorar
      try {
        await query(
          'INSERT INTO notification_views (notification_id, user_id, viewed_at) VALUES (?, ?, NOW())',
          [notificationId, userId]
        );
      } catch (insertError: any) {
        // Si es error de FK, la notificación no existe en la tabla correcta, pero no es crítico
        if (insertError.code === 'ER_NO_REFERENCED_ROW_2') {
          console.warn('Notificación no encontrada en tabla notifications, FK constraint:', notificationId);
          // Retornar success de todos modos para no bloquear UX
          return NextResponse.json({
            success: true,
            message: 'Notificación procesada'
          });
        }
        throw insertError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notificación marcada como vista'
    });

  } catch (error) {
    console.error('Error marking notification as viewed:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
