/**
 * API v2 - Plantilla individual
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { getTemplateEngine } from '@/lib/certificates/template-engine';

/**
 * GET - Obtener plantilla
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

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

    const template = await queryOne(
      `SELECT id, name, description, ${templateColumn} as template_html, ${cssColumn} as css_styles, is_active, is_default, created_at, updated_at 
       FROM certificate_templates WHERE id = ?`,
      [params.id]
    );

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error getting template:', error);
    return NextResponse.json(
      { error: 'Error al obtener plantilla' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Actualizar plantilla
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { name, description, html_content, css_styles, is_active, is_default } = body;

    // Validar sintaxis si se proporciona HTML
    if (html_content) {
      const templateEngine = getTemplateEngine();
      const validation = templateEngine.validate(html_content);
      
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'HTML inválido', details: validation.error },
          { status: 400 }
        );
      }
    }

    // Si es plantilla por defecto, desactivar las demás
    if (is_default) {
      await query(
        `UPDATE certificate_templates SET is_default = 0 WHERE id != ?`,
        [params.id]
      );
    }

    // Verificar qué columnas tiene la tabla
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

    // Actualizar plantilla
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    
    // Actualizar HTML en las columnas que existan
    if (html_content !== undefined) {
      if (hasHtmlContent && hasTemplateHtml) {
        updates.push('html_content = ?', 'template_html = ?');
        values.push(html_content, html_content); // Mismo contenido en ambas
      } else if (hasHtmlContent) {
        updates.push('html_content = ?');
        values.push(html_content);
      } else if (hasTemplateHtml) {
        updates.push('template_html = ?');
        values.push(html_content);
      }
    }
    
    // Actualizar CSS en las columnas que existan
    if (css_styles !== undefined) {
      if (hasCssStyles && hasTemplateCss) {
        updates.push('css_styles = ?', 'template_css = ?');
        values.push(css_styles, css_styles);
      } else if (hasCssStyles) {
        updates.push('css_styles = ?');
        values.push(css_styles);
      } else if (hasTemplateCss) {
        updates.push('template_css = ?');
        values.push(css_styles);
      }
    }
    
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }
    if (is_default !== undefined) {
      updates.push('is_default = ?');
      values.push(is_default ? 1 : 0);
    }

    updates.push('updated_at = NOW()');
    values.push(params.id);

    await query(
      `UPDATE certificate_templates SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: 'Plantilla actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Error al actualizar plantilla' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar plantilla
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Verificar si es plantilla por defecto
    const template = await queryOne(
      `SELECT is_default FROM certificate_templates WHERE id = ?`,
      [params.id]
    );

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    if (template.is_default) {
      return NextResponse.json(
        { error: 'No se puede eliminar la plantilla por defecto' },
        { status: 400 }
      );
    }

    await query(
      `DELETE FROM certificate_templates WHERE id = ?`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Plantilla eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Error al eliminar plantilla' },
      { status: 500 }
    );
  }
}

