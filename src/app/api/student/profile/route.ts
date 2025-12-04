import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'estudiante') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const userId = decoded.id;
    const body = await request.json();
    const {
      name,
      tipo_documento,
      numero_documento,
      fecha_nacimiento,
      genero,
      telefono,
      pais,
      departamento,
      ciudad,
      barrio,
      direccion,
      ocupacion,
      empresa
    } = body;

    // Validar nombre
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    // Normalizar fecha_nacimiento: convertir ISO string a formato YYYY-MM-DD
    let normalizedFechaNacimiento = null;
    if (fecha_nacimiento) {
      try {
        const date = new Date(fecha_nacimiento);
        if (!isNaN(date.getTime())) {
          // Formatear a YYYY-MM-DD
          normalizedFechaNacimiento = date.toISOString().split('T')[0];
        }
      } catch (error) {
        // Si ya está en formato YYYY-MM-DD, usarlo directamente
        if (typeof fecha_nacimiento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha_nacimiento)) {
          normalizedFechaNacimiento = fecha_nacimiento;
        }
      }
    }

    // Actualizar perfil (todos los campos excepto email)
    await query(`
      UPDATE users 
      SET 
        name = ?,
        tipo_documento = ?,
        numero_documento = ?,
        fecha_nacimiento = ?,
        genero = ?,
        telefono = ?,
        pais = ?,
        departamento = ?,
        ciudad = ?,
        barrio = ?,
        direccion = ?,
        ocupacion = ?,
        empresa = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      name.trim(),
      tipo_documento || null,
      numero_documento || null,
      normalizedFechaNacimiento,
      genero || null,
      telefono || null,
      pais || null,
      departamento || null,
      ciudad || null,
      barrio || null,
      direccion || null,
      ocupacion || null,
      empresa || null,
      userId
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Perfil actualizado correctamente' 
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el perfil' },
      { status: 500 }
    );
  }
}

