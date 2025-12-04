import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { TemplateEngine } from '@/lib/certificates/template-engine';
import { PDFGenerator } from '@/lib/certificates/pdf-generator';

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

    const { template_id, data } = await request.json();

    console.log('API recibió datos:', data);

    if (!template_id || !data) {
      return NextResponse.json(
        { error: 'template_id y data son requeridos' },
        { status: 400 }
      );
    }

    // Obtener plantilla
    const template = await queryOne(
      `SELECT id, name, description, template_html, template_css as css_styles, is_active, is_default 
       FROM certificate_templates WHERE id = ?`,
      [template_id]
    );

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    // Procesar plantilla con datos de ejemplo
    const templateEngine = new TemplateEngine();
    const renderData = {
      // Mapear variables a mayúsculas como espera la plantilla
      STUDENT_NAME: data.student_name,
      COURSE_NAME: data.course_title,
      DURATION_HOURS: data.duration_hours,
      COMPLETION_DATE: new Date(data.completion_date).toLocaleDateString('es-PY'),
      CERTIFICATE_NUMBER: data.certificate_number,
      START_DATE: new Date(data.completion_date).toLocaleDateString('es-PY'), // Usar misma fecha por ahora
      CUSTOM_SIGNATURE: data.custom_signature || data.instructor_names || 'Firma del Instructor',
      formatDate: (date: string) => new Date(date).toLocaleDateString('es-PY')
    } as any;
    
    console.log('Datos para renderizar:', renderData);
    
    const html = templateEngine.render(template.template_html, renderData);
    
    console.log('Plantilla HTML original:', template.template_html.substring(0, 300) + '...');
    console.log('HTML generado:', html.substring(0, 300) + '...');
    
    // Buscar las variables en el HTML generado
    const studentNameInHtml = html.includes(renderData.student_name);
    const courseTitleInHtml = html.includes(renderData.course_title);
    console.log('¿Nombre en HTML?', studentNameInHtml, 'Nombre buscado:', renderData.student_name);
    console.log('¿Curso en HTML?', courseTitleInHtml, 'Curso buscado:', renderData.course_title);

    // Generar PDF
    const pdfGenerator = new PDFGenerator();
    const pdfBuffer = await pdfGenerator.generatePDF(html);

    // Devolver PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="preview-${template.name}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { error: 'Error al generar preview' },
      { status: 500 }
    );
  }
}
