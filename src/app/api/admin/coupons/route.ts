import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, transaction } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener todos los cupones
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener cupones con información de usos y cursos
    const coupons = await query(`
      SELECT c.*, 
             COUNT(DISTINCT cu.id) as total_uses,
             GROUP_CONCAT(DISTINCT co.title ORDER BY co.title SEPARATOR ', ') as applicable_courses
      FROM coupons c
      LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
      LEFT JOIN coupon_courses cc ON c.id = cc.coupon_id
      LEFT JOIN courses co ON cc.course_id = co.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      coupons
    });

  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo cupón
export async function POST(request: NextRequest) {
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
      code, description, discount_percentage, min_price, max_uses, 
      one_time_per_user, expiry_date, is_active, application_type, specific_courses 
    } = body;

    // Validaciones
    if (!code || !discount_percentage) {
      return NextResponse.json(
        { error: 'El código y el descuento son requeridos' },
        { status: 400 }
      );
    }

    if (discount_percentage <= 0 || discount_percentage > 100) {
      return NextResponse.json(
        { error: 'El descuento debe estar entre 1 y 100' },
        { status: 400 }
      );
    }

    // Verificar que el código no exista
    const existingCoupon = await queryOne(
      'SELECT id FROM coupons WHERE code = ?',
      [code]
    );

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'El código del cupón ya existe' },
        { status: 400 }
      );
    }

    const result = await transaction(async (connection) => {
      // Insertar cupón
      const [insertResult] = await connection.execute(
        `INSERT INTO coupons (
          code, description, discount_percentage, min_price, max_uses, 
          one_time_per_user, expiry_date, is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          code,
          description || null,
          discount_percentage,
          min_price || 0,
          max_uses || 0,
          one_time_per_user ? 1 : 0,
          expiry_date || null,
          is_active ? 1 : 0,
          decoded.id
        ]
      );

      const couponId = (insertResult as any).insertId;

      // Asignar cursos específicos si aplica
      if (application_type === 'specific' && specific_courses && specific_courses.length > 0) {
        for (const courseId of specific_courses) {
          await connection.execute(
            'INSERT INTO coupon_courses (coupon_id, course_id) VALUES (?, ?)',
            [couponId, courseId]
          );
        }
      }

      return couponId;
    });

    return NextResponse.json({
      success: true,
      message: 'Cupón creado exitosamente',
      id: result
    });

  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


