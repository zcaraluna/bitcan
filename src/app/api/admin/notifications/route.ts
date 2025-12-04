import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener todas las notificaciones
export async function GET(request: NextRequest) {
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

    // Obtener notificaciones con información del creador
    const notifications = await query(`
      SELECT 
        n.*,
        u.name as creator_name
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      ORDER BY n.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva notificación
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

    const validTargets = ['all', 'estudiantes', 'profesores', 'superadmins', 'curso_especifico', 'combinado'];
    if (!validTargets.includes(target_type)) {
      return NextResponse.json(
        { error: 'Tipo de destinatario inválido' },
        { status: 400 }
      );
    }

    if (target_type === 'curso_especifico' && !target_course_id) {
      return NextResponse.json(
        { error: 'Debe seleccionar un curso' },
        { status: 400 }
      );
    }

    if (target_type === 'combinado' && !target_roles) {
      return NextResponse.json(
        { error: 'Debe especificar los roles' },
        { status: 400 }
      );
    }

    // Preparar target_roles según el tipo
    let finalTargetRoles: string | null = null;
    if (target_type === 'estudiantes') {
      finalTargetRoles = JSON.stringify(['estudiante']);
    } else if (target_type === 'profesores') {
      finalTargetRoles = JSON.stringify(['profesor']);
    } else if (target_type === 'superadmins') {
      finalTargetRoles = JSON.stringify(['superadmin']);
    } else if (target_type === 'combinado' && target_roles) {
      finalTargetRoles = target_roles;
    }

    // Preparar parámetros asegurando que no haya undefined
    const params = [
      title,
      message,
      type,
      target_type,
      target_course_id ?? null,
      finalTargetRoles,
      is_active ? 1 : 0,
      decoded.id
    ];

    // Debug: verificar que no haya undefined
    console.log('📦 Parámetros para INSERT:', params);
    const hasUndefined = params.some(p => p === undefined);
    if (hasUndefined) {
      console.error('❌ Hay parámetros undefined:', params);
      return NextResponse.json(
        { error: 'Error en los parámetros de la notificación' },
        { status: 400 }
      );
    }

    // Crear notificación
    const result = await query(`
      INSERT INTO notifications (
        title, message, type, target_type, target_course_id, 
        target_roles, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, params);

    return NextResponse.json({
      success: true,
      message: 'Notificación creada exitosamente',
      id: (result as any).insertId
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
