import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// POST - Cambiar rol de usuario
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
    const { user_id, new_role, reason } = body;

    // Validaciones
    if (!user_id || !new_role) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const validRoles = ['estudiante', 'profesor', 'superadmin'];
    if (!validRoles.includes(new_role)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    // Verificar que no se cambie el rol del superadmin actual
    if (user_id === decoded.id) {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propio rol' },
        { status: 400 }
      );
    }

    // Obtener información del usuario actual
    const currentUser = await queryOne(
      'SELECT name, email, role FROM users WHERE id = ?',
      [user_id]
    );

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const oldRole = currentUser.role;

    // Si el rol no cambia, no hacer nada
    if (oldRole === new_role) {
      return NextResponse.json(
        { error: 'El usuario ya tiene ese rol' },
        { status: 400 }
      );
    }

    try {
      // Iniciar transacción
      await query('START TRANSACTION');

      // Actualizar rol
      await query(
        'UPDATE users SET role = ? WHERE id = ?',
        [new_role, user_id]
      );

      // Registrar en auditoría
      await query(`
        INSERT INTO role_audit_log (user_id, old_role, new_role, changed_by, reason) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        user_id,
        oldRole,
        new_role,
        decoded.id,
        reason || 'Cambio de rol desde dashboard'
      ]);

      // Confirmar transacción
      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Rol cambiado exitosamente de '${oldRole}' a '${new_role}'`
      });

    } catch (transactionError) {
      // Revertir transacción
      await query('ROLLBACK');
      throw transactionError;
    }

  } catch (error) {
    console.error('Error changing role:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


