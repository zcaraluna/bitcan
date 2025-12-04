/**
 * Ejemplos de uso del sistema de certificados V2
 * Este archivo contiene ejemplos de cómo usar el sistema programáticamente
 */

import { getCertificateService } from '../src/lib/certificates/certificate-service';
import { getPDFGenerator } from '../src/lib/certificates/pdf-generator';
import { getTemplateEngine } from '../src/lib/certificates/template-engine';
import type { GenerateCertificateConfig } from '../src/types/certificates';

// =============================================================================
// EJEMPLO 1: Generar certificados de curso completo
// =============================================================================

async function example1_GenerateCertificates() {
  const service = getCertificateService();
  
  const config: GenerateCertificateConfig = {
    course_id: 1,
    student_ids: [10, 20, 30],
    certificate_type: 'course_completion',
    requires_rating: false,
  };
  
  const result = await service.generateCertificates(config, 1); // 1 = admin user id
  
  console.log(`Generados: ${result.generated_count} certificados`);
  console.log(`Errores: ${result.errors.length}`);
  
  result.certificates.forEach(cert => {
    console.log(`- Certificado ${cert.certificate_number} para estudiante ${cert.user_id}`);
  });
}

// =============================================================================
// EJEMPLO 2: Generar certificados de módulo
// =============================================================================

async function example2_GenerateModuleCertificates() {
  const service = getCertificateService();
  
  const config: GenerateCertificateConfig = {
    course_id: 1,
    student_ids: [10],
    certificate_type: 'module_completion',
    module_name: 'Módulo 1 - Introducción a la Ciberseguridad',
    manual_hours: 8,
    manual_completion_date: '2025-01-15',
    requires_rating: true,
  };
  
  const result = await service.generateCertificates(config, 1);
  console.log(`Certificado de módulo generado: ${result.certificates[0]?.certificate_number}`);
}

// =============================================================================
// EJEMPLO 3: Generar PDF de un certificado existente
// =============================================================================

async function example3_GeneratePDF() {
  const service = getCertificateService();
  
  const certificateId = 1;
  const pdfBuffer = await service.generatePDF(certificateId);
  
  // Guardar PDF
  const fs = await import('fs/promises');
  await fs.writeFile('certificado.pdf', pdfBuffer);
  
  console.log(`PDF generado: ${pdfBuffer.length} bytes`);
}

// =============================================================================
// EJEMPLO 4: Verificar certificado
// =============================================================================

async function example4_VerifyCertificate() {
  const service = getCertificateService();
  
  const certificateNumber = 'BIT2025XXXXX';
  const verification = await service.verifyCertificate(certificateNumber);
  
  if (verification.valid) {
    console.log('✓ Certificado válido');
    console.log(`Estudiante: ${verification.student_name}`);
    console.log(`Curso: ${verification.course_title}`);
    console.log(`Fecha: ${verification.issue_date}`);
  } else {
    console.log('✗ Certificado inválido');
    console.log(`Razón: ${verification.message}`);
  }
}

// =============================================================================
// EJEMPLO 5: Listar certificados con filtros
// =============================================================================

async function example5_ListCertificates() {
  const service = getCertificateService();
  
  const certificates = await service.listCertificates({
    status: 'issued',
    certificate_type: 'course_completion',
    date_from: '2025-01-01',
  });
  
  console.log(`Encontrados ${certificates.length} certificados`);
  
  certificates.forEach(cert => {
    const data = cert.certificate_data;
    if (data) {
      console.log(`- ${cert.certificate_number}: ${data.student_name} - ${data.course_title}`);
    } else {
      console.log(`- ${cert.certificate_number}: Sin datos de certificado`);
    }
  });
}

// =============================================================================
// EJEMPLO 6: Revocar certificado
// =============================================================================

async function example6_RevokeCertificate() {
  const service = getCertificateService();
  
  const certificateId = 1;
  const adminId = 1;
  const reason = 'Certificado emitido por error';
  
  await service.revokeCertificate(certificateId, adminId, reason);
  
  console.log(`Certificado ${certificateId} revocado`);
}

// =============================================================================
// EJEMPLO 7: Obtener estadísticas
// =============================================================================

async function example7_GetStats() {
  const service = getCertificateService();
  
  const stats = await service.getStats();
  
  console.log('Estadísticas de certificados:');
  console.log(`- Total emitidos: ${stats.total_issued}`);
  console.log(`- Total activos: ${stats.total_active}`);
  console.log(`- Total revocados: ${stats.total_revoked}`);
  console.log('\nPor tipo:');
  Object.entries(stats.by_type).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });
  console.log('\nTop 5 cursos:');
  stats.by_course.slice(0, 5).forEach(course => {
    console.log(`  - ${course.course_title}: ${course.count}`);
  });
}

// =============================================================================
// EJEMPLO 8: Renderizar plantilla personalizada
// =============================================================================

async function example8_RenderCustomTemplate() {
  const engine = getTemplateEngine();
  
  const template = `
    <div style="text-align: center; padding: 40px;">
      <h1>{{uppercase course_title}}</h1>
      <p>Certificado otorgado a: {{student_name}}</p>
      <p>Duración: {{formatNumber duration_hours}} horas</p>
      <p>Finalizado: {{formatDate completion_date}}</p>
      <p>Certificado N° {{certificate_number}}</p>
    </div>
  `;
  
  const data = {
    certificate_number: 'BIT2025XXXXX',
    student_name: 'Juan Pérez',
    course_title: 'Ciberseguridad Avanzada',
    duration_hours: 40,
    completion_date: '2025-01-15',
    issue_date: '2025-01-16',
    instructor_names: 'María González',
    organization_name: 'BITCAN',
    verification_url: 'https://bitcan.com/verify',
  };
  
  const html = engine.render(template, data as any);
  console.log('HTML renderizado:', html);
}

// =============================================================================
// EJEMPLO 9: Generar PDF desde HTML personalizado
// =============================================================================

async function example9_GeneratePDFFromCustomHTML() {
  const pdfGenerator = getPDFGenerator();
  const engine = getTemplateEngine();
  
  const template = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                width: 100%; height: 100vh; 
                display: flex; align-items: center; justify-content: center;
                color: white; font-family: Arial;">
      <div style="text-align: center;">
        <h1 style="font-size: 48px;">CERTIFICADO</h1>
        <h2 style="font-size: 36px; margin: 40px 0;">{{student_name}}</h2>
        <p style="font-size: 20px;">{{course_title}}</p>
        <p style="font-size: 16px; margin-top: 40px;">{{certificate_number}}</p>
      </div>
    </div>
  `;
  
  const data = {
    certificate_number: 'BIT2025TEST',
    student_name: 'María García',
    course_title: 'Análisis Forense Digital',
    duration_hours: 60,
    completion_date: new Date().toISOString(),
    issue_date: new Date().toISOString(),
    instructor_names: 'Carlos Rodríguez',
    organization_name: 'BITCAN',
    verification_url: 'https://bitcan.com/verify',
  };
  
  const html = engine.render(template, data as any);
  const completeHtml = engine.createCompleteHTML(html);
  
  const pdfBuffer = await pdfGenerator.generatePDF(completeHtml, {
    format: 'A4',
    orientation: 'landscape',
    printBackground: true,
  });
  
  // Guardar
  const fs = await import('fs/promises');
  await fs.writeFile('certificado_personalizado.pdf', pdfBuffer);
  
  console.log(`PDF personalizado generado: ${pdfBuffer.length} bytes`);
}

// =============================================================================
// EJEMPLO 10: Generar screenshot de certificado
// =============================================================================

async function example10_GenerateScreenshot() {
  const pdfGenerator = getPDFGenerator();
  
  const html = `
    <div style="background: #f0f0f0; width: 800px; height: 600px; 
                display: flex; align-items: center; justify-content: center;">
      <h1>Vista previa del certificado</h1>
    </div>
  `;
  
  const screenshot = await pdfGenerator.generateScreenshot(html, {
    width: 800,
    height: 600,
    fullPage: false,
  });
  
  // Guardar screenshot
  const fs = await import('fs/promises');
  await fs.writeFile('preview.png', screenshot);
  
  console.log(`Screenshot generado: ${screenshot.length} bytes`);
}

// =============================================================================
// EJEMPLO 11: Validar plantilla antes de guardar
// =============================================================================

async function example11_ValidateTemplate() {
  const engine = getTemplateEngine();
  
  const validTemplate = '<div>{{student_name}}</div>';
  const invalidTemplate = '<div>{{#if incomplete</div>';
  
  const validation1 = engine.validate(validTemplate);
  console.log('Plantilla válida:', validation1.valid);
  
  const validation2 = engine.validate(invalidTemplate);
  console.log('Plantilla inválida:', validation2.valid, validation2.error);
}

// =============================================================================
// EJEMPLO 12: Extraer variables de una plantilla
// =============================================================================

async function example12_ExtractVariables() {
  const engine = getTemplateEngine();
  
  const template = `
    <div>
      <h1>{{student_name}}</h1>
      <p>{{course_title}}</p>
      <p>{{formatDate issue_date}}</p>
      <p>{{certificate_number}}</p>
    </div>
  `;
  
  const variables = engine.extractVariables(template);
  console.log('Variables encontradas:', variables);
}

// =============================================================================
// Ejecutar ejemplos (descomentar el que quieras probar)
// =============================================================================

async function runExamples() {
  console.log('=== EJEMPLOS DE USO DEL SISTEMA DE CERTIFICADOS V2 ===\n');
  
  try {
    // Descomentar el ejemplo que quieras ejecutar:
    
    // await example1_GenerateCertificates();
    // await example2_GenerateModuleCertificates();
    // await example3_GeneratePDF();
    // await example4_VerifyCertificate();
    // await example5_ListCertificates();
    // await example6_RevokeCertificate();
    // await example7_GetStats();
    // await example8_RenderCustomTemplate();
    // await example9_GeneratePDFFromCustomHTML();
    // await example10_GenerateScreenshot();
    // await example11_ValidateTemplate();
    // await example12_ExtractVariables();
    
    console.log('\n✓ Ejemplo completado');
  } catch (error) {
    console.error('✗ Error ejecutando ejemplo:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runExamples();
}

// Exportar para uso en otros módulos
export {
  example1_GenerateCertificates,
  example2_GenerateModuleCertificates,
  example3_GeneratePDF,
  example4_VerifyCertificate,
  example5_ListCertificates,
  example6_RevokeCertificate,
  example7_GetStats,
  example8_RenderCustomTemplate,
  example9_GeneratePDFFromCustomHTML,
  example10_GenerateScreenshot,
  example11_ValidateTemplate,
  example12_ExtractVariables,
};




