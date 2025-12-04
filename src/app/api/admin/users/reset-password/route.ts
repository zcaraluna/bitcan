import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';

// POST - Restablecer contraseña de usuario
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
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Generar nueva contraseña temporal
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(tempPassword);

    // Actualizar contraseña
    await query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, user_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Contraseña restablecida exitosamente',
      tempPassword: tempPassword // En producción, esto debería enviarse por email
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














