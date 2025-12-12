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
    
    // LOGGING DETALLADO AL INICIO - FORZAR VISIBILIDAD
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📥 REQUEST RECIBIDO - Generación de Certificados');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Body recibido:', JSON.stringify(body, null, 2));
    console.log('Action recibida:', body.action);
    console.log('Module name recibido:', body.module_name);
    console.error('🔴 BACKEND LOG - Action:', body.action, '| Module:', body.module_name); // Usar console.error para que siempre se vea
    
    // VALIDACIÓN CRÍTICA AL INICIO: Verificar que la acción sea válida
    const { 
      action, 
      course_id, 
      student_ids, 
      module_name, 
      manual_hours, 
      manual_start_date, 
      manual_completion_date, 
      custom_signature,
      module_hours,
      module_start_date,
      module_completion_date,
      module_custom_signature,
      custom_message,
      requires_rating  // Agregar requires_rating a la extracción del body
    } = body;
    
    console.log(`🔍 DEBUG - requires_rating recibido en body: ${requires_rating} (tipo: ${typeof requires_rating})`);

    console.log(`🎯 Acción recibida: "${action}"`);
    console.log(`📚 Curso ID: ${course_id}`);
    console.log(`👥 Estudiantes: ${student_ids?.length || 0}`);
    console.log(`📝 Nombre de módulo: ${module_name || 'N/A'}`);

    // PROTECCIÓN CRÍTICA: Si la acción es generar módulos, asegurar que NO se procese como curso
    if (action === 'generate_module_certificates') {
      console.log('🔒🔒🔒 MODO MÓDULO ACTIVADO 🔒🔒🔒');
      console.log('   ⚠️  Solo se generarán certificados de módulo.');
      console.log('   🚫 Certificados de curso están BLOQUEADOS.');
      
      // Verificar que module_name esté presente (requerido para módulos)
      if (!module_name || !module_name.trim()) {
        console.error('❌ ERROR: Nombre de módulo faltante');
        return NextResponse.json({ 
          error: 'El nombre del módulo es requerido para generar certificados de módulo' 
        }, { status: 400 });
      }
    } else if (action === 'generate_certificates') {
      console.log('🔒🔒🔒 MODO CURSO ACTIVADO 🔒🔒🔒');
      console.log('   ⚠️  Solo se generarán certificados de curso completo.');
      console.log('   🚫 Certificados de módulo NO se generarán.');
    } else {
      console.error(`❌ ERROR: Acción inválida: "${action}"`);
      return NextResponse.json({ 
        error: `Acción inválida: ${action}. Acciones válidas: 'generate_certificates' o 'generate_module_certificates'` 
      }, { status: 400 });
    }
    
    // Mapear parámetros del frontend (module_*) a parámetros del backend (manual_*)
    // Usar parámetros de módulo si están presentes, sino usar los manuales
    const hours_to_use = module_hours || manual_hours;
    const start_date_to_use = module_start_date || manual_start_date;
    const completion_date_to_use = module_completion_date || manual_completion_date;
    const signature_to_use = module_custom_signature || custom_signature;

    if (!course_id || !student_ids || student_ids.length === 0) {
      return NextResponse.json({ error: 'Datos requeridos' }, { status: 400 });
    }

    // PROTECCIÓN ADICIONAL: Determinar el tipo de certificado UNA SOLA VEZ al inicio
    const expectedCertificateType = action === 'generate_module_certificates' ? 'module_completion' : 'course_completion';
    console.log(`🎯 Tipo de certificado esperado: ${expectedCertificateType} (acción: ${action})`);

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
    // Verificar qué columnas tiene la tabla
    const hasHtmlContent = await queryOne<{count: number}>(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'certificate_templates' 
      AND COLUMN_NAME = 'html_content'
    `);
    
    const templateColumn = hasHtmlContent && hasHtmlContent.count > 0 ? 'html_content' : 'template_html';
    const templateField = hasHtmlContent && hasHtmlContent.count > 0 ? 'html_content' : 'template_html';
    
    let template;
    if (action === 'generate_module_certificates') {
      // Para módulos, buscar plantilla de módulo que contenga MODULE_NAME o texto específico
      template = await queryOne(`
        SELECT ${templateColumn} as template_html, id, name 
        FROM certificate_templates 
        WHERE is_active = 1 
        AND (${templateColumn} LIKE '%MODULE_NAME%' 
             OR ${templateColumn} LIKE '%por haber completado exitosamente el módulo%')
        ORDER BY is_default DESC, id DESC
        LIMIT 1
      `);
      
      // Si no hay plantilla de módulo, usar la por defecto
      if (!template) {
        console.warn('No se encontró plantilla de módulo, usando plantilla por defecto');
        template = await queryOne(`
          SELECT ${templateColumn} as template_html, id, name 
          FROM certificate_templates 
          WHERE is_default = 1 AND is_active = 1 
          LIMIT 1
        `);
      }
    } else {
      // Para curso completo, usar la plantilla por defecto
      template = await queryOne(`
        SELECT ${templateColumn} as template_html, id, name 
        FROM certificate_templates 
        WHERE is_default = 1 AND is_active = 1 
        LIMIT 1
      `);
    }

    if (!template) {
      console.error('No hay plantilla de certificado disponible');
      return NextResponse.json({ error: 'No hay plantilla de certificado disponible' }, { status: 404 });
    }
    
    console.log(`✅ Plantilla encontrada para acción: ${action}`);

    let generated_count = 0;
    let skipped_count = 0;
    const errors: Array<{ student_id: number; reason: string }> = [];

    console.log(`🔄 Procesando ${student_ids.length} estudiantes para ${action}`);

    for (const student_id of student_ids) {
      try {
        // USAR EL TIPO DETERMINADO AL INICIO - NO RECALCULAR
        const certificateType = expectedCertificateType;
        
        // VALIDACIÓN FINAL: Asegurar que el tipo sea correcto
        if (action === 'generate_module_certificates' && certificateType !== 'module_completion') {
          console.error(`❌ ERROR CRÍTICO: Acción es generate_module_certificates pero certificateType es ${certificateType}`);
          errors.push({ 
            student_id, 
            reason: `Error crítico: tipo de certificado incorrecto. Esperado: module_completion, Obtenido: ${certificateType}` 
          });
          continue;
        }

        if (action !== 'generate_module_certificates' && certificateType !== 'course_completion') {
          console.error(`❌ ERROR CRÍTICO: Acción no es generate_module_certificates pero certificateType es ${certificateType}`);
          errors.push({ 
            student_id, 
            reason: `Error crítico: tipo de certificado incorrecto. Esperado: course_completion, Obtenido: ${certificateType}` 
          });
          continue;
        }
        
        console.log(`🔍 Verificando certificados existentes para estudiante ${student_id}, curso ${course_id}, tipo: ${certificateType}`);
        
        const existingCert = await queryOne(`
          SELECT COUNT(*) as total FROM certificates 
          WHERE user_id = ? AND course_id = ? 
          AND certificate_type = ?
        `, [student_id, course_id, certificateType]);

        if (existingCert && existingCert.total > 0) {
          console.log(`⏭️  Estudiante ${student_id}: Ya existe certificado de tipo ${certificateType}`);
          skipped_count++;
          continue; // Ya existe un certificado de este tipo
        }

        // IMPORTANTE: Verificar que NO se genere un certificado de curso cuando se genera uno de módulo
        if (action === 'generate_module_certificates') {
          // Verificar si ya existe un certificado de curso completo para este estudiante
          const existingCourseCert = await queryOne(`
            SELECT COUNT(*) as total FROM certificates 
            WHERE user_id = ? AND course_id = ? 
            AND certificate_type = 'course_completion'
          `, [student_id, course_id]);

          if (existingCourseCert && existingCourseCert.total > 0) {
            console.log(`⚠️  Estudiante ${student_id}: Ya tiene certificado de curso completo, pero se generará certificado de módulo (esto es correcto)`);
          }
          
          // VALIDACIÓN ADICIONAL: Asegurar que NO se genere un certificado de curso
          console.log(`✅ Estudiante ${student_id}: Generando SOLO certificado de módulo (tipo: ${certificateType}). NO se generará certificado de curso.`);
        } else {
          console.log(`✅ Estudiante ${student_id}: Generando certificado de curso completo (tipo: ${certificateType})`);
        }

        // Obtener información del estudiante
        const student = await queryOne(`
          SELECT name, email FROM users WHERE id = ?
        `, [student_id]);

        if (!student) {
          console.error(`❌ Estudiante ${student_id}: No encontrado`);
          errors.push({ student_id, reason: 'Estudiante no encontrado' });
          continue;
        }

        console.log(`📝 Procesando certificado para: ${student.name} (ID: ${student_id})`);

        // Generar número de certificado único
        const certificate_number = generateCertificateNumber();

        // Usar datos manuales o automáticos (con mapeo correcto)
        const final_hours = hours_to_use || course.duration_hours;
        const start_date = start_date_to_use || new Date().toISOString().split('T')[0];
        const completion_date = completion_date_to_use || new Date().toISOString().split('T')[0];
        const issue_date = new Date().toISOString().split('T')[0];

        // Preparar firma personalizada o usar la por defecto
        let signature_text;
        if (signature_to_use) {
          signature_text = signature_to_use;
        } else if (action === 'generate_module_certificates') {
          signature_text = `El mencionado módulo "${module_name}" ha sido dictado por\n${course.instructors || 'BITCAN'}`;
        } else {
          signature_text = `El mencionado curso ha sido dictado por\n${course.instructors || 'BITCAN'}`;
        }

      // Generar HTML del certificado
      // Nota: generateCertificateHTML usa reemplazo simple, no Handlebars
      // Por lo tanto, solo pasamos valores ya formateados
      // IMPORTANTE: Para módulos, COURSE_NAME debe ser el nombre del curso completo,
      // no el nombre del módulo. MODULE_NAME es el nombre del módulo específico.
      const courseNameForTemplate = course.title;
      const moduleNameForTemplate = action === 'generate_module_certificates' ? module_name : undefined;
      
      console.log(`📋 DEBUG - Valores para plantilla de certificado de módulo:`);
      console.log(`   COURSE_NAME (curso completo): "${courseNameForTemplate}"`);
      console.log(`   MODULE_NAME (módulo específico): "${moduleNameForTemplate}"`);
      console.log(`   course.title de BD: "${course.title}"`);
      console.log(`   module_name recibido: "${module_name}"`);
      
        const certificate_html = generateCertificateHTML(template.template_html, {
          STUDENT_NAME: student.name,
          COURSE_NAME: courseNameForTemplate, // Nombre del curso completo
          MODULE_NAME: moduleNameForTemplate, // Nombre del módulo específico
          DURATION_HOURS: final_hours,
          START_DATE: new Date(start_date).toLocaleDateString('es-PY'),
          COMPLETION_DATE: new Date(completion_date).toLocaleDateString('es-PY'),
          ISSUE_DATE: new Date(issue_date).toLocaleDateString('es-PY'),
          issue_date: issue_date, // Para formatDate helper si la plantilla lo usa
          CERTIFICATE_NUMBER: certificate_number,
          INSTRUCTOR_NAME: course.instructors || 'BITCAN',
          CUSTOM_SIGNATURE: signature_text,
          CUSTOM_MESSAGE: custom_message || ''
        });

        // Guardar certificado en la base de datos
        // IMPORTANTE: requires_rating puede venir como boolean true/false o como string "true"/"false"
        // Usar el valor extraído del body al inicio
        const requires_rating_value = requires_rating === true || requires_rating === 'true' || requires_rating === 1;
        
        console.log(`🔍 DEBUG - requires_rating para certificado ${certificate_number}: valor original = ${requires_rating} (tipo: ${typeof requires_rating}), procesado = ${requires_rating_value}`);
        
        // Guardar TODOS los campos del módulo en certificate_data para certificados de módulo
        const certificate_data = action === 'generate_module_certificates' 
          ? JSON.stringify({ 
              html: certificate_html,
              template_id: template.id, // Guardar template_id para regeneración
              student_name: student.name,
              course_title: course.title, // IMPORTANTE: Guardar el título del curso completo
              module_name: module_name,
              requires_rating: requires_rating_value,
              duration_hours: final_hours,
              module_hours: module_hours || null,
              start_date: start_date,
              module_start_date: module_start_date || null,
              completion_date: completion_date,
              module_completion_date: module_completion_date || null,
              instructor_name: course.instructors || 'BITCAN',
              custom_signature: signature_text,
              module_custom_signature: module_custom_signature || null,
              custom_message: custom_message || ''
            })
          : JSON.stringify({ 
              html: certificate_html,
              template_id: template.id,
              student_name: student.name,
              course_title: course.title
            });
        
        console.log(`🔍 DEBUG - certificate_data guardado para módulo:`, {
          module_name: module_name,
          requires_rating: requires_rating_value,
          module_hours: module_hours || null,
          module_start_date: module_start_date || null,
          module_completion_date: module_completion_date || null,
          module_custom_signature: module_custom_signature || null
        });

        // Verificar una vez más antes de insertar que el tipo es correcto
        if (action === 'generate_module_certificates' && certificateType !== 'module_completion') {
          console.error(`❌ ERROR: Se intentó generar certificado de módulo pero el tipo es ${certificateType}`);
          errors.push({ 
            student_id, 
            reason: `Error: tipo de certificado incorrecto. Esperado: module_completion, Obtenido: ${certificateType}` 
          });
          continue;
        }

        if (action !== 'generate_module_certificates' && certificateType !== 'course_completion') {
          console.error(`❌ ERROR: Se intentó generar certificado de curso pero el tipo es ${certificateType}`);
          errors.push({ 
            student_id, 
            reason: `Error: tipo de certificado incorrecto. Esperado: course_completion, Obtenido: ${certificateType}` 
          });
          continue;
        }

          // VALIDACIÓN FINAL ANTES DE INSERTAR: Verificar que el tipo sea correcto
          if (action === 'generate_module_certificates') {
            if (certificateType !== 'module_completion') {
              console.error(`❌ BLOQUEO CRÍTICO: Se intentó insertar certificado de tipo ${certificateType} cuando la acción es generar módulo.`);
              console.error(`   Acción: ${action}, Tipo esperado: module_completion, Tipo obtenido: ${certificateType}`);
              errors.push({ 
                student_id, 
                reason: `BLOQUEO: No se puede insertar certificado de tipo ${certificateType} cuando la acción es generar módulo` 
              });
              continue;
            }
          }

        // VALIDACIÓN FINAL ABSOLUTA: Asegurar que el tipo sea correcto ANTES de insertar
        let finalCertificateType = certificateType;
        
        if (action === 'generate_module_certificates') {
          // FORZAR que sea module_completion si la acción es generar módulos
          if (finalCertificateType !== 'module_completion') {
            console.error(`❌ BLOQUEO ABSOLUTO: Tipo incorrecto detectado. Forzando a module_completion.`);
            console.error(`   Tipo recibido: ${finalCertificateType}, Tipo forzado: module_completion`);
            finalCertificateType = 'module_completion';
          }
          console.log(`💾 Insertando certificado tipo: ${finalCertificateType} para estudiante ${student_id} (acción: ${action})`);
          console.log(`   ✅ Confirmación: Insertando SOLO certificado de módulo. Tipo: ${finalCertificateType}`);
        } else {
          // FORZAR que sea course_completion si la acción es generar curso
          if (finalCertificateType !== 'course_completion') {
            console.error(`❌ BLOQUEO ABSOLUTO: Tipo incorrecto detectado. Forzando a course_completion.`);
            console.error(`   Tipo recibido: ${finalCertificateType}, Tipo forzado: course_completion`);
            finalCertificateType = 'course_completion';
          }
          console.log(`💾 Insertando certificado tipo: ${finalCertificateType} para estudiante ${student_id} (acción: ${action})`);
        }

        // VALIDACIÓN FINAL: Rechazar explícitamente si el tipo no coincide con la acción
        if (action === 'generate_module_certificates' && finalCertificateType !== 'module_completion') {
          console.error(`❌ ERROR CRÍTICO: No se puede insertar certificado de tipo ${finalCertificateType} cuando action=${action}`);
          errors.push({ 
            student_id, 
            reason: `Error crítico: tipo de certificado no coincide con la acción` 
          });
          continue;
        }

        if (action !== 'generate_module_certificates' && finalCertificateType !== 'course_completion') {
          console.error(`❌ ERROR CRÍTICO: No se puede insertar certificado de tipo ${finalCertificateType} cuando action=${action}`);
          errors.push({ 
            student_id, 
            reason: `Error crítico: tipo de certificado no coincide con la acción` 
          });
          continue;
        }

        const insertResult = await query(`
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
          finalCertificateType  // Usar el tipo validado y forzado
        ]);

        // Verificar que se insertó correctamente con el tipo correcto
        const insertedCert = await queryOne(`
          SELECT id, certificate_type, certificate_number 
          FROM certificates 
          WHERE id = ?
        `, [(insertResult as any).insertId]);

        if (!insertedCert) {
          console.error(`❌ ERROR: No se pudo verificar el certificado insertado`);
          errors.push({ 
            student_id, 
            reason: `Error: no se pudo verificar el certificado insertado` 
          });
          continue;
        }

        if (insertedCert.certificate_type !== finalCertificateType) {
          console.error(`❌ ERROR CRÍTICO: Certificado insertado con tipo incorrecto!`);
          console.error(`   Esperado: ${finalCertificateType}, Obtenido: ${insertedCert.certificate_type}`);
          console.error(`   Acción: ${action}, ID: ${insertedCert.id}`);
          errors.push({ 
            student_id, 
            reason: `Error crítico: certificado insertado con tipo incorrecto. Esperado: ${finalCertificateType}, Obtenido: ${insertedCert.certificate_type}` 
          });
          continue;
        }

        if (action === 'generate_module_certificates' && insertedCert.certificate_type !== 'module_completion') {
          console.error(`❌ ERROR CRÍTICO: Se insertó certificado de curso cuando debería ser de módulo!`);
          console.error(`   Tipo en BD: ${insertedCert.certificate_type}, Acción: ${action}`);
          errors.push({ 
            student_id, 
            reason: `Error crítico: se insertó certificado de curso cuando debería ser de módulo` 
          });
          continue;
        }

        console.log(`✅ Certificado generado correctamente: ${certificate_number} (ID: ${insertedCert.id}) tipo: ${insertedCert.certificate_type} para ${student.name}`);
        console.log(`   ✅ Confirmación final: Tipo en BD = ${insertedCert.certificate_type}, Acción = ${action}`);
        generated_count++;
      } catch (error) {
        console.error(`❌ Error procesando estudiante ${student_id}:`, error);
        errors.push({ 
          student_id, 
          reason: error instanceof Error ? error.message : 'Error desconocido' 
        });
      }
    }

    const message = action === 'generate_module_certificates' 
      ? `Se generaron ${generated_count} certificados de módulo exitosamente${skipped_count > 0 ? ` (${skipped_count} omitidos por ya existir)` : ''}${errors.length > 0 ? ` (${errors.length} errores)` : ''}`
      : `Se generaron ${generated_count} certificados exitosamente${skipped_count > 0 ? ` (${skipped_count} omitidos por ya existir)` : ''}${errors.length > 0 ? ` (${errors.length} errores)` : ''}`;

    console.log(`📊 Resumen: ${generated_count} generados, ${skipped_count} omitidos, ${errors.length} errores`);

    return NextResponse.json({
      success: true,
      message: message,
      generated_count: generated_count,
      skipped_count: skipped_count,
      errors: errors.length > 0 ? errors : undefined
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