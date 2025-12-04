import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// PUT - Actualizar cupón
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      description, discount_percentage, min_price, max_uses, 
      one_time_per_user, expiry_date, is_active, application_type, specific_courses 
    } = body;

    // Validaciones
    if (!discount_percentage || discount_percentage <= 0 || discount_percentage > 100) {
      return NextResponse.json(
        { error: 'El descuento debe estar entre 1 y 100' },
        { status: 400 }
      );
    }

    await transaction(async (connection) => {
      // Actualizar cupón
      await connection.execute(
        `UPDATE coupons SET 
          description = ?, 
          discount_percentage = ?, 
          min_price = ?, 
          max_uses = ?, 
          one_time_per_user = ?, 
          expiry_date = ?,
          is_active = ?
        WHERE id = ?`,
        [
          description || null,
          discount_percentage,
          min_price || 0,
          max_uses || 0,
          one_time_per_user ? 1 : 0,
          expiry_date || null,
          is_active ? 1 : 0,
          params.id
        ]
      );

      // Actualizar cursos aplicables
      // Eliminar relaciones existentes
      await connection.execute('DELETE FROM coupon_courses WHERE coupon_id = ?', [params.id]);

      // Asignar nuevos cursos específicos si aplica
      if (application_type === 'specific' && specific_courses && specific_courses.length > 0) {
        for (const courseId of specific_courses) {
          await connection.execute(
            'INSERT INTO coupon_courses (coupon_id, course_id) VALUES (?, ?)',
            [params.id, courseId]
          );
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Cupón actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar cupón
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Eliminar cupón (las relaciones se eliminarán en cascada si está configurado)
    await query('DELETE FROM coupons WHERE id = ?', [params.id]);

    return NextResponse.json({
      success: true,
      message: 'Cupón eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














