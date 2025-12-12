import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// PUT - Actualizar plantilla
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

    const templateId = params.id;
    const body = await request.json();
    const { name, description, template_html, is_default, is_active } = body;

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

    // Si es plantilla por defecto, desactivar otras plantillas por defecto
    if (is_default) {
      await query(`
        UPDATE certificate_templates 
        SET is_default = 0 
        WHERE is_default = 1 AND id != ?
      `, [templateId]);
    }

    // Construir UPDATE dinámicamente según las columnas disponibles
    const updates: string[] = ['name = ?', 'description = ?'];
    const values: any[] = [name, description];

    // Actualizar HTML en las columnas que existan
    if (hasHtmlContent && hasTemplateHtml) {
      updates.push('html_content = ?', 'template_html = ?');
      values.push(template_html, template_html); // Mismo contenido en ambas
    } else if (hasHtmlContent) {
      updates.push('html_content = ?');
      values.push(template_html);
    } else if (hasTemplateHtml) {
      updates.push('template_html = ?');
      values.push(template_html);
    }

    updates.push('is_default = ?', 'is_active = ?', 'updated_at = NOW()');
    values.push(is_default ? 1 : 0, is_active ? 1 : 0, templateId);

    await query(
      `UPDATE certificate_templates SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: 'Plantilla actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar plantilla
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

    const templateId = params.id;

    // Verificar que no sea la plantilla por defecto
    const template = await queryOne(`
      SELECT is_default FROM certificate_templates WHERE id = ?
    `, [templateId]);

    if (!template) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }

    if (template.is_default) {
      return NextResponse.json({ 
        error: 'No se puede eliminar la plantilla por defecto. Primero establece otra como predeterminada.' 
      }, { status: 400 });
    }

    await query(`
      DELETE FROM certificate_templates WHERE id = ?
    `, [templateId]);

    return NextResponse.json({
      success: true,
      message: 'Plantilla eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}




