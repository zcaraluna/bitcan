import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// POST - Activar/Desactivar usuario
export async function POST(request: NextRequest) {
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
    const { user_id, is_active } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Actualizar estado del usuario
    await query(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active ? 1 : 0, user_id]
    );

    return NextResponse.json({
      success: true,
      message: `Usuario ${is_active ? 'activado' : 'desactivado'} exitosamente`
    });

  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














