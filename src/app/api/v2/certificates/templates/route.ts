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
    
    // Construir la lista de columnas y valores dinámicamente
    const insertColumns: string[] = ['name', 'description'];
    const insertValues: any[] = [name, description];
    
    // Si tiene ambas columnas, insertar en ambas
    if (hasHtmlContent && hasTemplateHtml) {
      insertColumns.push('html_content', 'template_html');
      insertValues.push(html_content, html_content); // Mismo contenido en ambas
    } else if (hasHtmlContent) {
      insertColumns.push('html_content');
      insertValues.push(html_content);
    } else if (hasTemplateHtml) {
      insertColumns.push('template_html');
      insertValues.push(html_content);
    }
    
    // Agregar CSS
    if (hasCssStyles && hasTemplateCss) {
      insertColumns.push('css_styles', 'template_css');
      insertValues.push(css_styles || null, css_styles || null);
    } else if (hasCssStyles) {
      insertColumns.push('css_styles');
      insertValues.push(css_styles || null);
    } else if (hasTemplateCss) {
      insertColumns.push('template_css');
      insertValues.push(css_styles || null);
    }
    
    // Agregar campos finales
    insertColumns.push('is_active', 'is_default', 'created_by', 'created_at', 'updated_at');
    insertValues.push(1, is_default ? 1 : 0, decoded.id);
    
    const placeholders = insertColumns.map(() => '?').join(', ');
    const sql = `INSERT INTO certificate_templates (${insertColumns.join(', ')}) VALUES (${placeholders}, NOW(), NOW())`;
    
    const queryResult = await query(sql, insertValues) as any;
    result = Array.isArray(queryResult) ? queryResult[0] : queryResult;

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

