import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'estudiante') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { coupon_code, course_id, course_price } = body;

    if (!coupon_code || !coupon_code.trim()) {
      return NextResponse.json(
        { success: false, error: 'Código de cupón requerido' },
        { status: 400 }
      );
    }

    if (!course_id || course_id <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    if (course_price < 0) {
      return NextResponse.json(
        { success: false, error: 'Precio de curso inválido' },
        { status: 400 }
      );
    }

    // Verificar si el cupón existe y está activo
    const coupon = await queryOne(`
      SELECT c.*, cc.course_id as coupon_course_id
      FROM coupons c
      LEFT JOIN coupon_courses cc ON c.id = cc.coupon_id AND cc.course_id = ?
      WHERE c.code = ? AND c.is_active = 1
      LIMIT 1
    `, [course_id, coupon_code.trim().toUpperCase()]);

    if (!coupon) {
      return NextResponse.json({
        success: false,
        error: 'Cupón no encontrado o inactivo'
      });
    }

    // Verificar fecha de expiración
    const currentDate = new Date().toISOString().split('T')[0];
    if (coupon.expiry_date && coupon.expiry_date < currentDate) {
      return NextResponse.json({
        success: false,
        error: 'Cupón expirado'
      });
    }

    // Verificar si el cupón es válido para este curso
    // Si el cupón tiene cursos específicos, verificar que este curso esté incluido
    const couponCourses = await query(`
      SELECT course_id FROM coupon_courses WHERE coupon_id = ?
    `, [coupon.id]);

    if (couponCourses.length > 0) {
      // El cupón tiene cursos específicos
      const isValidForCourse = couponCourses.some((cc: any) => cc.course_id === course_id);
      if (!isValidForCourse) {
        return NextResponse.json({
          success: false,
          error: 'Este cupón no es válido para este curso'
        });
      }
    }

    // Verificar límite de uso y calcular usos restantes
    let remainingUses: number | null = null;
    if (coupon.max_uses && coupon.max_uses > 0) {
      const usage = await queryOne(`
        SELECT COUNT(*) as used_count 
        FROM coupon_usage 
        WHERE coupon_id = ?
      `, [coupon.id]);

      remainingUses = coupon.max_uses - (usage?.used_count || 0);

      if (remainingUses <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Cupón agotado'
        });
      }
    }

    // Verificar si el usuario ya usó este cupón (si es de uso único por usuario)
    if (coupon.one_time_per_user) {
      const userUsage = await queryOne(`
        SELECT COUNT(*) as used_count 
        FROM coupon_usage 
        WHERE coupon_id = ? AND user_id = ?
      `, [coupon.id, decoded.id]);

      if (userUsage && userUsage.used_count > 0) {
        return NextResponse.json({
          success: false,
          error: 'Ya has usado este cupón'
        });
      }
    }

    // Verificar precio mínimo si aplica
    if (coupon.min_price && coupon.min_price > 0 && course_price < coupon.min_price) {
      return NextResponse.json({
        success: false,
        error: 'Precio mínimo no alcanzado para este cupón'
      });
    }

    // Cupón válido
    return NextResponse.json({
      success: true,
      message: 'Cupón válido',
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_percentage: coupon.discount_percentage,
        description: coupon.description,
        remaining_uses: remainingUses,
        max_uses: coupon.max_uses
      }
    });

  } catch (error) {
    console.error('Error verifying coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Error al verificar el cupón' },
      { status: 500 }
    );
  }
}

