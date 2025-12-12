import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { TemplateEngine } from '@/lib/certificates/template-engine';
import { PDFGenerator } from '@/lib/certificates/pdf-generator';
import { CertificateService } from '@/lib/certificates/certificate-service';
import type { ResultSetHeader } from 'mysql2';

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

    const { 
      course_id, 
      student_ids, 
      template_id, 
      custom_signature,
      certificate_type = 'course_completion',
      module_name,
      manual_hours,
      manual_start_date,
      manual_completion_date,
      custom_message,
      requires_rating,
      // Campos específicos de módulo
      module_hours,
      module_start_date,
      module_completion_date,
      module_custom_signature
    } = await request.json();
    
    console.log(`🔍 DEBUG V2 - requires_rating recibido: ${requires_rating} (tipo: ${typeof requires_rating})`);
    console.log(`🔍 DEBUG V2 - Campos de módulo:`, {
      module_name,
      module_hours,
      module_start_date,
      module_completion_date,
      module_custom_signature
    });

    if (!course_id || !student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return NextResponse.json(
        { error: 'course_id y student_ids son requeridos' },
        { status: 400 }
      );
    }

    // Obtener plantilla (usar por defecto si no se especifica)
    // Verificar qué columnas tiene la tabla
    const hasHtmlContent = await queryOne<{count: number}>(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'certificate_templates' 
      AND COLUMN_NAME = 'html_content'
    `);
    
    const templateColumn = hasHtmlContent && hasHtmlContent.count > 0 ? 'html_content' : 'template_html';
    const cssColumn = hasHtmlContent && hasHtmlContent.count > 0 ? 'css_styles' : 'template_css';
    
    let template;
    if (template_id) {
      template = await queryOne(
        `SELECT id, name, description, ${templateColumn} as template_html, ${cssColumn} as css_styles, is_active, is_default 
         FROM certificate_templates WHERE id = ? AND is_active = 1`,
        [template_id]
      );
    } else {
      // Para módulos, buscar plantilla que contenga MODULE_NAME o el texto específico
      if (certificate_type === 'module_completion') {
        template = await queryOne(
          `SELECT id, name, description, ${templateColumn} as template_html, ${cssColumn} as css_styles, is_active, is_default 
           FROM certificate_templates 
           WHERE is_active = 1 
             AND (${templateColumn} LIKE '%MODULE_NAME%' 
                  OR ${templateColumn} LIKE '%por haber completado exitosamente el módulo%')
           ORDER BY is_default DESC, id DESC
           LIMIT 1`
        );
      }
      
      // Si no se encontró plantilla de módulo o es certificado de curso, usar la por defecto
      if (!template) {
        template = await queryOne(
          `SELECT id, name, description, ${templateColumn} as template_html, ${cssColumn} as css_styles, is_active, is_default 
           FROM certificate_templates 
           WHERE is_default = 1 AND is_active = 1
           LIMIT 1`
        );
      }
    }

    if (!template) {
      return NextResponse.json(
        { error: 'No se encontró plantilla activa' },
        { status: 404 }
      );
    }

    // Obtener datos del curso
    const course = await queryOne(
      `SELECT c.*, u.name as instructor_name 
       FROM courses c 
       LEFT JOIN users u ON c.instructor_id = u.id 
       WHERE c.id = ?`,
      [course_id]
    );

    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    const results = [];
    const templateEngine = new TemplateEngine();
    const pdfGenerator = new PDFGenerator();
    const certificateService = new CertificateService();

    // Procesar cada estudiante
    for (const student_id of student_ids) {
      try {
        // Obtener datos del estudiante
        const student = await queryOne(
          `SELECT * FROM users WHERE id = ?`,
          [student_id]
        );

        if (!student) {
          console.error(`Estudiante ${student_id} no encontrado`);
          continue;
        }

        // Verificar inscripción del estudiante
        const enrollment = await queryOne(
          `SELECT * FROM user_courses 
           WHERE user_id = ? AND course_id = ?`,
          [student_id, course_id]
        );

        if (!enrollment) {
          console.error(`Estudiante ${student_id} no está inscrito en el curso`);
          continue;
        }

        // Para certificados de curso completo, verificar que esté completado
        // Para módulos, no es necesario
        if (certificate_type === 'course_completion' && !enrollment.completed_at) {
          console.error(`Estudiante ${student_id} no completó el curso`);
          continue;
        }

        // Generar número de certificado único
        const certificateNumber = `BIT${new Date().getFullYear()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

        // Preparar datos para la plantilla
        const completionDate = manual_completion_date 
          ? new Date(manual_completion_date) 
          : (enrollment.completed_at ? new Date(enrollment.completed_at) : new Date());
        const startDate = manual_start_date 
          ? new Date(manual_start_date) 
          : (enrollment.started_at ? new Date(enrollment.started_at) : new Date());
        const hoursToUse = manual_hours || course.duration_hours || 0;
        const courseName = certificate_type === 'module_completion' && module_name 
          ? module_name 
          : course.title;
        
        // Preparar fecha de emisión
        const issueDate = new Date();
        const issueDateString = issueDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD para formatDate helper
        
        // Para certificados de módulo, incluir MODULE_NAME y COURSE_NAME por separado
        const renderData = {
          STUDENT_NAME: student.name,
          COURSE_NAME: certificate_type === 'module_completion' ? course.title : courseName,
          MODULE_NAME: certificate_type === 'module_completion' ? module_name : undefined,
          DURATION_HOURS: hoursToUse,
          COMPLETION_DATE: completionDate.toLocaleDateString('es-PY'),
          START_DATE: startDate.toLocaleDateString('es-PY'),
          ISSUE_DATE: issueDate.toLocaleDateString('es-PY'), // Para uso directo en plantillas
          issue_date: issueDateString, // Para uso con formatDate helper (minúsculas)
          CERTIFICATE_NUMBER: certificateNumber,
          CUSTOM_SIGNATURE: custom_signature || course.instructor_name || 'Instructor',
          CUSTOM_MESSAGE: custom_message || '',
        } as any;

        // Renderizar plantilla
        const html = templateEngine.render(template.template_html, renderData);

        // Generar PDF
        const pdfBuffer = await pdfGenerator.generatePDF(html);

        // Validar que certificate_type sea un valor válido del ENUM
        // Valores permitidos: 'course_completion', 'module_completion', 'achievement', 'participation'
        const validCertificateTypes = ['course_completion', 'module_completion', 'achievement', 'participation'];
        const dbCertificateType = validCertificateTypes.includes(certificate_type) 
          ? certificate_type 
          : 'course_completion'; // Valor por defecto

        // Guardar certificado en la base de datos
        const result = await query<ResultSetHeader>(
          `INSERT INTO certificates (
            user_id, course_id, certificate_type, status, 
            certificate_number, issue_date, completion_date, certificate_data, 
            issued_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            student_id,
            course_id,
            dbCertificateType,
            'issued',
            certificateNumber,
            new Date().toISOString().split('T')[0],
            completionDate.toISOString().split('T')[0],
            JSON.stringify({
              template_id: template.id,
              student_name: student.name,
              course_title: courseName,
              module_name: certificate_type === 'module_completion' ? module_name : undefined,
              start_date: manual_start_date || module_start_date || enrollment?.started_at,
              completion_date: manual_completion_date || module_completion_date || enrollment?.completed_at,
              duration_hours: hoursToUse,
              instructor_name: course.instructor_name,
              custom_signature: custom_signature || module_custom_signature,
              custom_message: custom_message,
              html_content: html,
              // Campos específicos de módulo
              requires_rating: certificate_type === 'module_completion' 
                ? (requires_rating === true || requires_rating === 'true' || requires_rating === 1) 
                : undefined,
              module_hours: certificate_type === 'module_completion' ? (module_hours || null) : undefined,
              module_start_date: certificate_type === 'module_completion' ? (module_start_date || null) : undefined,
              module_completion_date: certificate_type === 'module_completion' ? (module_completion_date || null) : undefined,
              module_custom_signature: certificate_type === 'module_completion' ? (module_custom_signature || null) : undefined
            }),
            decoded.id
          ]
        );

        const certificate = {
          id: (result as any as ResultSetHeader).insertId,
          certificate_number: certificateNumber
        };

        results.push({
          student_id,
          student_name: student.name,
          certificate_id: certificate.id,
          certificate_number: certificateNumber,
          success: true
        });

      } catch (error) {
        console.error(`Error procesando estudiante ${student_id}:`, error);
        results.push({
          student_id,
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Certificados generados: ${results.filter(r => r.success).length}/${results.length}`,
      data: results
    });

  } catch (error) {
    console.error('Error generating certificates:', error);
    return NextResponse.json(
      { error: 'Error al generar certificados' },
      { status: 500 }
    );
  }
}

