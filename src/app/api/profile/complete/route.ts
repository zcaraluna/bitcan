import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

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
      empresa,
    } = body;

    // Validar campos obligatorios
    if (!name || !tipo_documento || !numero_documento || !pais || !departamento || !ciudad || !barrio || !direccion) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben estar completos' },
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

    // Actualizar el perfil del usuario
    await query(
      `UPDATE users SET 
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
        profile_completed = 1,
        updated_at = NOW()
      WHERE id = ?`,
      [
        name.trim(),
        tipo_documento,
        numero_documento,
        normalizedFechaNacimiento,
        genero || null,
        telefono || null,
        pais,
        departamento,
        ciudad,
        barrio,
        direccion,
        ocupacion || null,
        empresa || null,
        decoded.id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Perfil completado exitosamente',
    });
  } catch (error) {
    console.error('Error completing profile:', error);
    return NextResponse.json(
      { error: 'Error al completar perfil' },
      { status: 500 }
    );
  }
}

