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

    // Si es plantilla por defecto, desactivar otras plantillas por defecto
    if (is_default) {
      await query(`
        UPDATE certificate_templates 
        SET is_default = 0 
        WHERE is_default = 1 AND id != ?
      `, [templateId]);
    }

    await query(`
      UPDATE certificate_templates 
      SET name = ?, description = ?, template_html = ?, is_default = ?, is_active = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, description, template_html, is_default ? 1 : 0, is_active ? 1 : 0, templateId]);

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




