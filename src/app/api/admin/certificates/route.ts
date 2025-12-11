import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener estudiantes elegibles para certificados
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

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');
    const action = searchParams.get('action');

    if (!courseId) {
      return NextResponse.json({ error: 'ID de curso requerido' }, { status: 400 });
    }

    // Si no se especifica action, devolver lista de certificados por defecto
    if (!action) {
      const certificates = await query(`
        SELECT 
          c.id,
          c.certificate_number,
          c.issue_date,
          c.status,
          u.name as student_name,
          u.email as student_email
        FROM certificates c
        JOIN users u ON c.user_id = u.id
        WHERE c.course_id = ?
        ORDER BY c.issue_date DESC
      `, [courseId]);

      // Formatear fechas
      const formattedCertificates = certificates.map(cert => ({
        ...cert,
        issue_date: new Date(cert.issue_date).toLocaleDateString('es-PY')
      }));

      return NextResponse.json({
        success: true,
        certificates: formattedCertificates
      });
    }

    switch (action) {
      case 'eligible_students':
        // Obtener estudiantes que han completado el curso
        const eligibleStudents = await query(`
          SELECT 
            u.id,
            u.name,
            u.email,
            uc.completed_at,
            CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as has_certificate
          FROM user_courses uc
          JOIN users u ON uc.user_id = u.id
          LEFT JOIN certificates c ON uc.user_id = c.user_id AND uc.course_id = c.course_id 
            AND (c.certificate_type = 'course' OR c.certificate_type IS NULL)
          WHERE uc.course_id = ? AND uc.completed_at IS NOT NULL
          ORDER BY u.name
        `, [courseId]);

        // Formatear fechas
        const formattedStudents = eligibleStudents.map(student => ({
          ...student,
          completion_date: new Date(student.completed_at).toLocaleDateString('es-PY')
        }));

        return NextResponse.json({
          success: true,
          students: formattedStudents
        });

      case 'certificates_list':
        // Obtener lista de certificados de un curso
        const certificates = await query(`
          SELECT 
            c.id,
            c.certificate_number,
            c.issue_date,
            c.status,
            u.name as student_name,
            u.email as student_email
          FROM certificates c
          JOIN users u ON c.user_id = u.id
          WHERE c.course_id = ?
          ORDER BY c.issue_date DESC
        `, [courseId]);

        // Formatear fechas
        const formattedCertificates = certificates.map(cert => ({
          ...cert,
          issue_date: new Date(cert.issue_date).toLocaleDateString('es-PY')
        }));

        return NextResponse.json({
          success: true,
          certificates: formattedCertificates
        });

      case 'course_students':
        // Obtener todos los estudiantes de un curso (para certificados de módulo)
        const students = await query(`
          SELECT 
            u.id,
            u.name,
            u.email,
            uc.completed_at,
            CASE WHEN uc.completed_at IS NOT NULL THEN 1 ELSE 0 END as completed
          FROM user_courses uc
          JOIN users u ON uc.user_id = u.id
          WHERE uc.course_id = ?
          ORDER BY u.name
        `, [courseId]);

        return NextResponse.json({
          success: true,
          students: students
        });

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in certificates API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Generar certificados
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
    const { action, course_id, student_ids, module_name, manual_hours, manual_start_date, manual_completion_date, custom_signature, custom_message } = body;

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

    // Obtener plantilla según el tipo de certificado
    let template;
    if (action === 'generate_module_certificates') {
      // Para módulos, usar la segunda plantilla (plantilla de módulo)
      template = await queryOne(`
        SELECT template_html FROM certificate_templates 
        WHERE is_active = 1 AND is_default = 0
        LIMIT 1
      `);
    } else {
      // Para curso completo, usar la plantilla por defecto
      template = await queryOne(`
        SELECT template_html FROM certificate_templates 
        WHERE is_default = 1 AND is_active = 1 
        LIMIT 1
      `);
    }

    if (!template) {
      return NextResponse.json({ error: 'No hay plantilla de certificado disponible' }, { status: 404 });
    }

    let generated_count = 0;

    for (const student_id of student_ids) {
      // Verificar si ya existe un certificado
      const certificateType = action === 'generate_module_certificates' ? 'module_completion' : 'course_completion';
      const existingCert = await queryOne(`
        SELECT COUNT(*) as total FROM certificates 
        WHERE user_id = ? AND course_id = ? 
        AND (certificate_type = ? OR (? = 'course_completion' AND (certificate_type IS NULL OR certificate_type = 'course')))
      `, [student_id, course_id, certificateType, certificateType]);

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

      // Usar datos manuales o automáticos
      const hours_to_use = manual_hours || course.duration_hours;
      const start_date = manual_start_date || new Date().toISOString().split('T')[0];
      const completion_date = manual_completion_date || new Date().toISOString().split('T')[0];
      const issue_date = new Date().toISOString().split('T')[0];

      // Preparar firma personalizada o usar la por defecto
      let signature_text;
      if (custom_signature) {
        signature_text = custom_signature;
      } else if (action === 'generate_module_certificates') {
        signature_text = `El mencionado módulo "${module_name}" ha sido dictado por\n${course.instructors || 'BITCAN'}`;
      } else {
        signature_text = `El mencionado curso ha sido dictado por\n${course.instructors || 'BITCAN'}`;
      }

      // Generar HTML del certificado
      // Nota: generateCertificateHTML usa reemplazo simple, no Handlebars
      // Por lo tanto, solo pasamos valores ya formateados
      const certificate_html = generateCertificateHTML(template.template_html, {
        STUDENT_NAME: student.name,
        COURSE_NAME: action === 'generate_module_certificates' ? course.title : course.title,
        MODULE_NAME: action === 'generate_module_certificates' ? module_name : undefined,
        DURATION_HOURS: hours_to_use,
        START_DATE: new Date(start_date).toLocaleDateString('es-PY'),
        COMPLETION_DATE: new Date(completion_date).toLocaleDateString('es-PY'),
        ISSUE_DATE: new Date(issue_date).toLocaleDateString('es-PY'),
        issue_date: issue_date, // Para formatDate helper si la plantilla lo usa
        CERTIFICATE_NUMBER: certificate_number,
        INSTRUCTOR_NAME: course.instructors || 'BITCAN',
        CUSTOM_SIGNATURE: signature_text,
        CUSTOM_MESSAGE: body.custom_message || ''
      });

      // Guardar certificado en la base de datos
      const requires_rating = body.requires_rating === true;
      const certificate_data = action === 'generate_module_certificates' 
        ? JSON.stringify({ html: certificate_html, module_name: module_name, requires_rating: requires_rating })
        : JSON.stringify({ html: certificate_html });

      await query(`
        INSERT INTO certificates (
          user_id, course_id, certificate_number, issue_date, completion_date,
          status, certificate_data, issued_by, created_at, updated_at, certificate_type
        ) VALUES (?, ?, ?, ?, ?, 'issued', ?, ?, NOW(), NOW(), ?)
      `, [
        student_id,
        course_id,
        certificate_number,
        issue_date,
        completion_date,
        certificate_data,
        decoded.id,
        certificateType
      ]);

      generated_count++;
    }

    const message = action === 'generate_module_certificates' 
      ? `Se generaron ${generated_count} certificados de módulo exitosamente`
      : `Se generaron ${generated_count} certificados exitosamente`;

    return NextResponse.json({
      success: true,
      message: message,
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