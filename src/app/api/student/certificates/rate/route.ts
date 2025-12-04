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
    const {
      course_id,
      professor_rating,
      professor_feedback,
      platform_rating,
      platform_feedback,
      course_rating,
      course_feedback
    } = body;

    // Validar calificaciones
    if (
      !professor_rating || professor_rating < 1 || professor_rating > 5 ||
      !platform_rating || platform_rating < 1 || platform_rating > 5 ||
      !course_rating || course_rating < 1 || course_rating > 5 ||
      !professor_feedback || !professor_feedback.trim() ||
      !platform_feedback || !platform_feedback.trim() ||
      !course_feedback || !course_feedback.trim()
    ) {
      return NextResponse.json(
        { error: 'Las calificaciones deben estar entre 1 y 5 estrellas y todos los comentarios son obligatorios.' },
        { status: 400 }
      );
    }

    // Insertar o actualizar calificación
    const ratingResult = await query(`
      INSERT INTO course_ratings (
        user_id, course_id, professor_rating, professor_feedback,
        platform_rating, platform_feedback, course_rating, course_feedback
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        professor_rating = VALUES(professor_rating),
        professor_feedback = VALUES(professor_feedback),
        platform_rating = VALUES(platform_rating),
        platform_feedback = VALUES(platform_feedback),
        course_rating = VALUES(course_rating),
        course_feedback = VALUES(course_feedback)
    `, [
      userId,
      course_id,
      professor_rating,
      professor_feedback.trim(),
      platform_rating,
      platform_feedback.trim(),
      course_rating,
      course_feedback.trim()
    ]);

    let ratingId = (ratingResult as any).insertId;
    
    // Si no hay insertId, obtener el ID existente
    if (!ratingId) {
      const existingRating = await queryOne(
        'SELECT id FROM course_ratings WHERE user_id = ? AND course_id = ?',
        [userId, course_id]
      );
      ratingId = existingRating?.id;
    }

    // Marcar certificado como recibido (curso completo o módulo que requiere calificación)
    // Primero actualizar certificados de curso completo
    await query(`
      UPDATE certificates 
      SET is_received = 1, rating_id = ?
      WHERE user_id = ? AND course_id = ? AND (certificate_type = 'course' OR certificate_type IS NULL)
    `, [ratingId, userId, course_id]);

    // Luego actualizar certificados de módulo que requieren calificación
    const moduleCertificates = await query(`
      SELECT id, certificate_data 
      FROM certificates 
      WHERE user_id = ? AND course_id = ? AND certificate_type = 'module'
    `, [userId, course_id]);

    for (const cert of moduleCertificates) {
      const certData = cert.certificate_data ? JSON.parse(cert.certificate_data) : {};
      if (certData.requires_rating === true) {
        await query(`
          UPDATE certificates 
          SET is_received = 1, rating_id = ?
          WHERE id = ?
        `, [ratingId, cert.id]);
      }
    }

    return NextResponse.json({
      success: true,
      message: '¡Gracias por tu calificación! Tu certificado ya está disponible para descargar.'
    });

  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { error: 'Error al enviar la calificación' },
      { status: 500 }
    );
  }
}

