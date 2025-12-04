import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
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
    const body = await request.json();
    const { notification_email, notification_push } = body;

    // Actualizar preferencias de notificación
    await query(`
      UPDATE users 
      SET notification_email = ?, notification_push = ?, updated_at = NOW()
      WHERE id = ?
    `, [notification_email ? 1 : 0, notification_push ? 1 : 0, userId]);

    return NextResponse.json({ 
      success: true, 
      message: 'Preferencias de notificación actualizadas' 
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Error al actualizar las preferencias de notificación' },
      { status: 500 }
    );
  }
}

