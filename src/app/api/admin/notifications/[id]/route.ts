import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener una notificación específica
export async function GET(
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

    const notification = await queryOne(
      'SELECT * FROM notifications WHERE id = ?',
      [params.id]
    );

    if (!notification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar notificación
export async function PUT(
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
    const { title, message, type, target_type, target_course_id, target_roles, is_active } = body;

    // Validaciones
    if (!title || !message || !target_type) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const validTypes = ['info', 'warning', 'success', 'error'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de notificación inválido' },
        { status: 400 }
      );
    }

    // Preparar target_roles según el tipo
    let finalTargetRoles = target_roles;
    if (target_type === 'estudiantes') {
      finalTargetRoles = JSON.stringify(['estudiante']);
    } else if (target_type === 'profesores') {
      finalTargetRoles = JSON.stringify(['profesor']);
    } else if (target_type === 'superadmins') {
      finalTargetRoles = JSON.stringify(['superadmin']);
    }

    // Actualizar notificación
    await query(`
      UPDATE notifications 
      SET title = ?, message = ?, type = ?, target_type = ?, 
          target_course_id = ?, target_roles = ?, is_active = ?
      WHERE id = ?
    `, [
      title,
      message,
      type,
      target_type,
      target_course_id || null,
      finalTargetRoles || null,
      is_active ? 1 : 0,
      params.id
    ]);

    return NextResponse.json({
      success: true,
      message: 'Notificación actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar notificación
export async function DELETE(
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

    // Eliminar notificación
    await query('DELETE FROM notifications WHERE id = ?', [params.id]);

    return NextResponse.json({
      success: true,
      message: 'Notificación eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














