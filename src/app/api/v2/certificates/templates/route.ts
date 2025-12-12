/**
 * API v2 - Plantillas de certificados
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { getTemplateEngine, DEFAULT_TEMPLATES } from '@/lib/certificates/template-engine';
import type { ResultSetHeader } from 'mysql2';

/**
 * GET - Listar plantillas
 */
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

    const templates = await query(
      `SELECT id, name, description, template_html as html_content, template_css as css_styles, is_active, is_default, created_at, updated_at
       FROM certificate_templates
       ORDER BY is_default DESC, name ASC`
    );

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error listing templates:', error);
    return NextResponse.json(
      { error: 'Error al listar plantillas' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crear plantilla
 */
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
    const { name, description, template_type, html_content, css_styles, is_default } = body;

    if (!name || !html_content) {
      return NextResponse.json(
        { error: 'Nombre y contenido HTML son requeridos' },
        { status: 400 }
      );
    }

    // Validar sintaxis
    const templateEngine = getTemplateEngine();
    const validation = templateEngine.validate(html_content);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'HTML inválido', details: validation.error },
        { status: 400 }
      );
    }

    // Si es plantilla por defecto, desactivar las demás
    if (is_default) {
      await query(
        `UPDATE certificate_templates SET is_default = 0`
      );
    }

    // Crear plantilla
    // Verificar qué columnas tiene la tabla (html_content vs template_html)
    const columns = await query<{COLUMN_NAME: string}>(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'certificate_templates' 
       AND COLUMN_NAME IN ('html_content', 'template_html', 'css_styles', 'template_css')`
    ) as any[];
    
    const columnNames = columns.map((col: any) => col.COLUMN_NAME);
    const hasHtmlContent = columnNames.includes('html_content');
    const hasTemplateHtml = columnNames.includes('template_html');
    const hasCssStyles = columnNames.includes('css_styles');
    const hasTemplateCss = columnNames.includes('template_css');
    
    let result: ResultSetHeader;
    
    if (hasHtmlContent) {
      // Usar html_content y css_styles (estructura del VPS)
      result = await query<ResultSetHeader>(
        `INSERT INTO certificate_templates 
         (name, description, html_content${hasCssStyles ? ', css_styles' : ''}, is_active, is_default, created_by, created_at, updated_at)
         VALUES (?, ?, ?${hasCssStyles ? ', ?' : ''}, 1, ?, ?, NOW(), NOW())`,
        hasCssStyles 
          ? [name, description, html_content, css_styles || null, is_default ? 1 : 0, decoded.id]
          : [name, description, html_content, is_default ? 1 : 0, decoded.id]
      );
    } else if (hasTemplateHtml) {
      // Usar template_html y template_css (estructura antigua)
      result = await query<ResultSetHeader>(
        `INSERT INTO certificate_templates 
         (name, description, template_html${hasTemplateCss ? ', template_css' : ''}, is_active, is_default, created_by, created_at, updated_at)
         VALUES (?, ?, ?${hasTemplateCss ? ', ?' : ''}, 1, ?, ?, NOW(), NOW())`,
        hasTemplateCss
          ? [name, description, html_content, css_styles || null, is_default ? 1 : 0, decoded.id]
          : [name, description, html_content, is_default ? 1 : 0, decoded.id]
      );
    } else {
      // Intentar con html_content por defecto (asumir estructura del VPS)
      result = await query<ResultSetHeader>(
        `INSERT INTO certificate_templates 
         (name, description, html_content, css_styles, is_active, is_default, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?, NOW(), NOW())`,
        [name, description, html_content, css_styles || null, is_default ? 1 : 0, decoded.id]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Plantilla creada exitosamente',
      data: { id: (result as any as ResultSetHeader).insertId },
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Error al crear plantilla' },
      { status: 500 }
    );
  }
}

