import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener emails de superadmin
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener emails de superadmin
    const emails = await query(
      'SELECT id, email, created_at FROM super_admin_emails ORDER BY email'
    );

    return NextResponse.json({
      success: true,
      emails
    });

  } catch (error) {
    console.error('Error fetching super admin emails:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Agregar email de superadmin
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Verificar que el email no esté duplicado
    const existingEmail = await queryOne(
      'SELECT id FROM super_admin_emails WHERE email = ?',
      [email]
    );

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este email ya está configurado como superadmin' },
        { status: 400 }
      );
    }

    // Agregar email
    await query(
      'INSERT INTO super_admin_emails (email, created_at) VALUES (?, NOW())',
      [email]
    );

    return NextResponse.json({
      success: true,
      message: 'Email de superadmin agregado exitosamente'
    });

  } catch (error) {
    console.error('Error adding super admin email:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar email de superadmin
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { email_id } = body;

    if (!email_id) {
      return NextResponse.json(
        { error: 'ID de email requerido' },
        { status: 400 }
      );
    }

    // Verificar que el email existe
    const existingEmail = await queryOne(
      'SELECT email FROM super_admin_emails WHERE id = ?',
      [email_id]
    );

    if (!existingEmail) {
      return NextResponse.json(
        { error: 'Email no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar email
    await query(
      'DELETE FROM super_admin_emails WHERE id = ?',
      [email_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Email de superadmin eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error removing super admin email:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














