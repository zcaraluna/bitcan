import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// PATCH - Activar/desactivar notificación
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { is_active } = body;

    // Actualizar estado
    await query(
      'UPDATE notifications SET is_active = ? WHERE id = ?',
      [is_active ? 1 : 0, params.id]
    );

    return NextResponse.json({
      success: true,
      message: `Notificación ${is_active ? 'activada' : 'desactivada'} exitosamente`
    });

  } catch (error) {
    console.error('Error toggling notification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














