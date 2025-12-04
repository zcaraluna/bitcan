/**
 * Motor de plantillas para certificados
 * Renderiza HTML con datos dinámicos
 */

import Handlebars from 'handlebars';
// import { CertificateRenderData } from '@/types/certificates';

// Registrar helpers de Handlebars
Handlebars.registerHelper('formatDate', function (date: string) {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch (error) {
    return '';
  }
});

Handlebars.registerHelper('formatNumber', function (num: number) {
  if (num === undefined || num === null) return '';
  return num.toLocaleString('es-PY');
});

Handlebars.registerHelper('uppercase', function (str: string) {
  return str ? str.toUpperCase() : '';
});

Handlebars.registerHelper('lowercase', function (str: string) {
  return str ? str.toLowerCase() : '';
});

Handlebars.registerHelper('eq', function (a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper('gt', function (a: number, b: number) {
  return a > b;
});

Handlebars.registerHelper('lt', function (a: number, b: number) {
  return a < b;
});

export class TemplateEngine {
  /**
   * Renderizar plantilla con datos
   */
  render(templateHtml: string, data: any): string {
    try {
      const template = Handlebars.compile(templateHtml);
      return template(data);
    } catch (error) {
      console.error('Error rendering template:', error);
      throw new Error('Error al renderizar plantilla de certificado');
    }
  }

  /**
   * Validar sintaxis de plantilla
   */
  validate(templateHtml: string): { valid: boolean; error?: string } {
    try {
      Handlebars.compile(templateHtml);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Extraer variables de una plantilla
   */
  extractVariables(templateHtml: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(templateHtml)) !== null) {
      const variable = match[1].trim();
      // Ignorar helpers y estructuras de control
      if (!variable.startsWith('#') && !variable.startsWith('/') && !variable.startsWith('!')) {
        const cleanVar = variable.split(' ')[0];
        variables.add(cleanVar);
      }
    }

    return Array.from(variables);
  }

  /**
   * Crear HTML completo con estilos
   */
  createCompleteHTML(content: string, css?: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4 landscape;
      margin: 0;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .certificate-container {
      width: 297mm;
      height: 210mm;
      position: relative;
      overflow: hidden;
    }
    
    ${css || ''}
  </style>
</head>
<body>
  <div class="certificate-container">
    ${content}
  </div>
</body>
</html>
    `.trim();
  }
}

// Instancia singleton
let templateEngineInstance: TemplateEngine | null = null;

/**
 * Obtener instancia del motor de plantillas
 */
export function getTemplateEngine(): TemplateEngine {
  if (!templateEngineInstance) {
    templateEngineInstance = new TemplateEngine();
  }
  return templateEngineInstance;
}

/**
 * Plantillas predefinidas
 */
export const DEFAULT_TEMPLATES = {
  modern: {
    name: 'Moderno',
    html: `
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white;">
  <div style="text-align: center; padding: 40px;">
    <h1 style="font-size: 48px; margin-bottom: 20px; font-weight: bold;">CERTIFICADO</h1>
    <p style="font-size: 24px; margin-bottom: 40px;">Se otorga a</p>
    <h2 style="font-size: 56px; margin-bottom: 40px; font-weight: bold; text-transform: uppercase;">{{student_name}}</h2>
    <p style="font-size: 20px; margin-bottom: 20px;">Por completar exitosamente el curso</p>
    <h3 style="font-size: 32px; margin-bottom: 40px; font-weight: 600;">{{course_title}}</h3>
    <div style="display: flex; justify-content: space-around; max-width: 600px; margin: 0 auto;">
      <div>
        <p style="font-size: 14px; opacity: 0.9;">Duración</p>
        <p style="font-size: 20px; font-weight: bold;">{{duration_hours}} horas</p>
      </div>
      <div>
        <p style="font-size: 14px; opacity: 0.9;">Fecha de emisión</p>
        <p style="font-size: 20px; font-weight: bold;">{{formatDate issue_date}}</p>
      </div>
    </div>
    <p style="font-size: 14px; margin-top: 60px; opacity: 0.8;">Certificado N° {{certificate_number}}</p>
  </div>
</div>
    `,
  },
  classic: {
    name: 'Clásico',
    html: `
<div style="background: #fff; width: 100%; height: 100%; padding: 60px; border: 20px solid #2c3e50; position: relative;">
  <div style="border: 3px solid #e74c3c; padding: 40px; height: 100%;">
    <div style="text-align: center;">
      <h1 style="font-size: 64px; color: #2c3e50; margin-bottom: 30px; font-family: 'Georgia', serif;">Certificado de Finalización</h1>
      <p style="font-size: 24px; color: #555; margin-bottom: 50px;">Este certificado se otorga a</p>
      <h2 style="font-size: 48px; color: #e74c3c; margin-bottom: 50px; text-decoration: underline;">{{student_name}}</h2>
      <p style="font-size: 20px; color: #555; margin-bottom: 20px;">Por haber completado satisfactoriamente</p>
      <h3 style="font-size: 36px; color: #2c3e50; margin-bottom: 60px;">{{course_title}}</h3>
      <div style="display: flex; justify-content: space-between; max-width: 500px; margin: 0 auto;">
        <div style="text-align: left;">
          <p style="font-size: 16px; color: #777;">Instructor: {{instructor_names}}</p>
          <p style="font-size: 16px; color: #777;">Duración: {{duration_hours}} horas</p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 16px; color: #777;">Fecha: {{formatDate completion_date}}</p>
          <p style="font-size: 16px; color: #777;">N°: {{certificate_number}}</p>
        </div>
      </div>
    </div>
  </div>
</div>
    `,
  },
  minimal: {
    name: 'Minimalista',
    html: `
<div style="background: #f8f9fa; width: 100%; height: 100%; padding: 80px; display: flex; flex-direction: column; justify-content: center;">
  <div style="max-width: 800px; margin: 0 auto;">
    <div style="border-left: 5px solid #000; padding-left: 40px;">
      <p style="font-size: 18px; color: #666; margin-bottom: 10px;">BITCAN certifica que</p>
      <h1 style="font-size: 52px; color: #000; margin-bottom: 30px; font-weight: 300;">{{student_name}}</h1>
      <p style="font-size: 20px; color: #666; margin-bottom: 10px;">ha completado el curso</p>
      <h2 style="font-size: 36px; color: #000; margin-bottom: 60px; font-weight: 400;">{{course_title}}</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 16px; color: #666;">
        <div>Duración: {{duration_hours}} horas</div>
        <div>Finalización: {{formatDate completion_date}}</div>
        <div>Instructor: {{instructor_names}}</div>
        <div>N°: {{certificate_number}}</div>
      </div>
    </div>
  </div>
</div>
    `,
  },
};








