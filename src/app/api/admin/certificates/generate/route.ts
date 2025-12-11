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
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { course_id, student_ids } = body;

    if (!course_id || !student_ids || student_ids.length === 0) {
      return NextResponse.json({ error: 'Datos requeridos' }, { status: 400 });
    }

    // Obtener información del curso
    const course = await queryOne(`
      SELECT c.title, c.duration_hours, c.identifier,
             GROUP_CONCAT(u.name SEPARATOR ', ') as instructors
      FROM courses c
      LEFT JOIN course_instructors ci ON c.id = ci.course_id
      LEFT JOIN users u ON ci.instructor_id = u.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [course_id]);

    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Obtener plantilla por defecto
    const template = await queryOne(`
      SELECT template_html FROM certificate_templates 
      WHERE is_default = 1 AND is_active = 1 
      LIMIT 1
    `);

    if (!template) {
      return NextResponse.json({ error: 'No hay plantilla de certificado disponible' }, { status: 404 });
    }

    let generated_count = 0;

    for (const student_id of student_ids) {
      // Verificar si ya existe un certificado de curso completo
      const existingCert = await queryOne(`
        SELECT COUNT(*) as total FROM certificates 
        WHERE user_id = ? AND course_id = ? 
        AND (certificate_type = 'course_completion' OR certificate_type = 'course' OR certificate_type IS NULL)
      `, [student_id, course_id]);

      if (existingCert.total > 0) {
        continue; // Ya existe un certificado
      }

      // Obtener información del estudiante
      const student = await queryOne(`
        SELECT name, email FROM users WHERE id = ?
      `, [student_id]);

      if (!student) {
        continue;
      }

      // Generar número de certificado único
      const certificate_number = generateCertificateNumber();

      // Usar datos del curso
      const hours_to_use = course.duration_hours;
      const completion_date = new Date().toISOString().split('T')[0];
      const issue_date = new Date().toISOString().split('T')[0];

      // Preparar firma
      const signature_text = `El mencionado curso ha sido dictado por\n${course.instructors || 'BITCAN'}`;

      // Generar HTML del certificado
      const certificate_html = generateCertificateHTML(template.template_html, {
        STUDENT_NAME: student.name,
        COURSE_NAME: course.title,
        DURATION_HOURS: hours_to_use,
        START_DATE: new Date().toLocaleDateString('es-PY'),
        COMPLETION_DATE: new Date().toLocaleDateString('es-PY'),
        CERTIFICATE_NUMBER: certificate_number,
        INSTRUCTOR_NAME: course.instructors || 'BITCAN',
        CUSTOM_SIGNATURE: signature_text
      });

      // Guardar certificado en la base de datos
      const certificate_data = JSON.stringify({ html: certificate_html });

      await query(`
        INSERT INTO certificates (
          user_id, course_id, certificate_number, issue_date, completion_date,
          status, certificate_data, issued_by, created_at, updated_at, certificate_type
        ) VALUES (?, ?, ?, ?, ?, 'issued', ?, ?, NOW(), NOW(), 'course_completion')
      `, [
        student_id,
        course_id,
        certificate_number,
        issue_date,
        completion_date,
        certificate_data,
        decoded.id
      ]);

      generated_count++;
    }

    return NextResponse.json({
      success: true,
      message: `Se generaron ${generated_count} certificados exitosamente`,
      generated_count: generated_count
    });

  } catch (error) {
    console.error('Error generating certificates:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Generar número de certificado único
 */
function generateCertificateNumber(): string {
  const prefix = 'BIT';
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${year}${random}`;
}

/**
 * Generar HTML del certificado con datos reemplazados
 */
function generateCertificateHTML(template: string, data: Record<string, any>): string {
  let html = template;
  
  Object.entries(data).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  
  return html;
}