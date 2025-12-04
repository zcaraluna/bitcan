import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener todas las plantillas
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

    const templates = await query(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.template_html,
        t.is_default,
        t.is_active,
        t.created_at,
        u.name as created_by_name
      FROM certificate_templates t
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.is_default DESC, t.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      templates: templates
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva plantilla
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
    const { name, description, template_html, is_default } = body;

    if (!name || !template_html) {
      return NextResponse.json({ error: 'Nombre y HTML son requeridos' }, { status: 400 });
    }

    // Si es plantilla por defecto, desactivar otras plantillas por defecto
    if (is_default) {
      await query(`
        UPDATE certificate_templates 
        SET is_default = 0 
        WHERE is_default = 1
      `);
    }

    const result = await query(`
      INSERT INTO certificate_templates (
        name, description, template_html, is_default, is_active, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 1, ?, NOW(), NOW())
    `, [name, description, template_html, is_default ? 1 : 0, decoded.id]);

    return NextResponse.json({
      success: true,
      message: 'Plantilla creada exitosamente',
      id: (result as any).insertId
    });

  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}




