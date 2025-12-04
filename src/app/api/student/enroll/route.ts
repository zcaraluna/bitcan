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

    const userId = decoded.id;
    const body = await request.json();
    const { course_id, coupon_id, discount_percentage } = body;

    if (!course_id) {
      return NextResponse.json(
        { error: 'ID del curso requerido' },
        { status: 400 }
      );
    }

    // Verificar que el curso existe y está publicado
    const course = await queryOne(`
      SELECT id, title, is_published, requires_approval, max_students, is_free, price
      FROM courses 
      WHERE id = ?
    `, [course_id]);

    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    if (!course.is_published) {
      return NextResponse.json(
        { error: 'Este curso no está disponible' },
        { status: 400 }
      );
    }

    // Verificar si ya está inscrito
    const existingEnrollment = await queryOne(`
      SELECT id FROM user_courses 
      WHERE user_id = ? AND course_id = ?
    `, [userId, course_id]);

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Ya estás inscrito en este curso' },
        { status: 400 }
      );
    }

    // Verificar si ya tiene una solicitud pendiente
    const existingApplication = await queryOne(`
      SELECT id, status FROM course_applications 
      WHERE user_id = ? AND course_id = ?
    `, [userId, course_id]);

    if (existingApplication) {
      if (existingApplication.status === 'pending') {
        return NextResponse.json(
          { error: 'Ya tienes una solicitud pendiente para este curso' },
          { status: 400 }
        );
      } else if (existingApplication.status === 'rejected') {
        return NextResponse.json(
          { error: 'Tu solicitud para este curso fue rechazada anteriormente' },
          { status: 400 }
        );
      }
    }

    // Verificar límite de estudiantes
    if (course.max_students) {
      const currentStudents = await queryOne(`
        SELECT COUNT(*) as count FROM user_courses WHERE course_id = ?
      `, [course_id]);

      if (currentStudents.count >= course.max_students) {
        return NextResponse.json(
          { error: 'El curso ha alcanzado el límite de estudiantes' },
          { status: 400 }
        );
      }
    }

    // Si el curso es de pago (no es gratis y tiene precio), siempre crear postulación pendiente
    const isPaidCourse = !course.is_free && (course.price && course.price > 0);
    
    // Si requiere aprobación O es un curso de pago, crear solicitud pendiente
    if (course.requires_approval || isPaidCourse) {
      // Iniciar transacción para manejar cupón y postulación
      const { transaction } = await import('@/lib/db');
      
      await transaction(async (connection) => {
        // Insertar postulación
        await connection.execute(`
          INSERT INTO course_applications (user_id, course_id, status, application_date)
          VALUES (?, ?, 'pending', NOW())
        `, [userId, course_id]);

        // Si hay cupón aplicado, registrar su uso
        if (coupon_id && discount_percentage && discount_percentage > 0 && isPaidCourse) {
          const original_price = course.price;
          const discount_amount = (original_price * discount_percentage) / 100;
          const final_price = original_price - discount_amount;
          
          // Registrar uso del cupón
          await connection.execute(`
            INSERT INTO coupon_usage (coupon_id, user_id, course_id, discount_amount, original_price, final_price, used_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
          `, [coupon_id, userId, course_id, discount_amount, original_price, final_price]);
          
          // Actualizar contador de uso del cupón
          await connection.execute(`
            UPDATE coupons SET used_count = used_count + 1 WHERE id = ?
          `, [coupon_id]);
        }
      });

      return NextResponse.json({
        success: true,
        message: isPaidCourse 
          ? 'Tu postulación ha sido enviada. Realiza el pago y espera la confirmación.'
          : 'Tu solicitud de inscripción ha sido enviada. Espera la aprobación del instructor.',
        pending: true
      });
    }

    // Inscribir directamente solo si es gratis y no requiere aprobación
    await query(`
      INSERT INTO user_courses (user_id, course_id, started_at, progress, completed)
      VALUES (?, ?, NOW(), 0, 0)
    `, [userId, course_id]);

    return NextResponse.json({
      success: true,
      message: '¡Te has inscrito exitosamente en el curso!',
      pending: false
    });

  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { error: 'Error al inscribirse en el curso' },
      { status: 500 }
    );
  }
}

