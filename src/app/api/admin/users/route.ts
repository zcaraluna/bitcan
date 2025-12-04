import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener usuarios con paginación y filtros
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';

    const offset = (page - 1) * limit;

    // Construir condiciones WHERE
    const whereConditions = [];
    const params = [];

    if (search) {
      whereConditions.push(`
        (u.name LIKE ? OR u.email LIKE ? OR up.telefono LIKE ? OR 
         up.numero_documento LIKE ?)
      `);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (roleFilter) {
      whereConditions.push('u.role = ?');
      params.push(roleFilter);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Contar total de usuarios
    const countSql = `
      SELECT COUNT(*) as total 
      FROM users u 
      LEFT JOIN user_profiles up ON u.id = up.user_id 
      ${whereClause}
    `;
    const countResult = await queryOne<{ total: number }>(countSql, params);
    const totalUsers = countResult?.total || 0;
    const totalPages = Math.ceil(totalUsers / limit);

    // Obtener usuarios - construir la consulta de manera diferente para evitar problemas con parámetros
    let usersSql: string;
    let queryParams: any[];

    if (whereConditions.length > 0) {
      usersSql = `
        SELECT 
          u.*,
          up.telefono, up.ciudad, up.pais, up.departamento,
          up.tipo_documento, up.numero_documento, up.fecha_nacimiento, up.genero,
          up.ocupacion, up.empresa, up.direccion, up.barrio,
          COUNT(DISTINCT uc.course_id) as total_courses,
          COUNT(DISTINCT ca.id) as total_applications
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN user_courses uc ON u.id = uc.user_id
        LEFT JOIN course_applications ca ON u.id = ca.user_id
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `;
      queryParams = [...params, limit.toString(), offset.toString()];
    } else {
      usersSql = `
        SELECT 
          u.*,
          up.telefono, up.ciudad, up.pais, up.departamento,
          up.tipo_documento, up.numero_documento, up.fecha_nacimiento, up.genero,
          up.ocupacion, up.empresa, up.direccion, up.barrio,
          COUNT(DISTINCT uc.course_id) as total_courses,
          COUNT(DISTINCT ca.id) as total_applications
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN user_courses uc ON u.id = uc.user_id
        LEFT JOIN course_applications ca ON u.id = ca.user_id
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `;
      queryParams = [limit.toString(), offset.toString()];
    }

    const users = await query(usersSql, queryParams);

    return NextResponse.json({
      success: true,
      users,
      totalUsers,
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar usuario
export async function PUT(request: NextRequest) {
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
    const {
      id,
      name,
      email,
      role,
      is_active,
      telefono,
      ciudad,
      pais,
      departamento,
      tipo_documento,
      numero_documento,
      fecha_nacimiento,
      genero,
      barrio,
      direccion,
      ocupacion,
      empresa,
    } = body;

    // Validaciones
    if (!id || !name || !email || !role) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Verificar que el email no esté duplicado
    const emailCheck = await queryOne(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    );

    if (emailCheck) {
      return NextResponse.json(
        { error: 'El email ya está en uso por otro usuario' },
        { status: 400 }
      );
    }

    // Actualizar usuario
    await query(
      `UPDATE users SET 
        name = ?, email = ?, role = ?, is_active = ?
        WHERE id = ?`,
      [name, email, role, is_active ? 1 : 0, id]
    );

    // Actualizar o insertar perfil
    const profileExists = await queryOne(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [id]
    );

    // Normalizar fecha_nacimiento: convertir ISO string a formato YYYY-MM-DD
    let normalizedFechaNacimiento = null;
    if (fecha_nacimiento) {
      try {
        const date = new Date(fecha_nacimiento);
        if (!isNaN(date.getTime())) {
          normalizedFechaNacimiento = date.toISOString().split('T')[0];
        }
      } catch (error) {
        if (typeof fecha_nacimiento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha_nacimiento)) {
          normalizedFechaNacimiento = fecha_nacimiento;
        }
      }
    }

    if (profileExists) {
      await query(
        `UPDATE user_profiles SET 
          telefono = ?, ciudad = ?, pais = ?, departamento = ?,
          tipo_documento = ?, numero_documento = ?, fecha_nacimiento = ?,
          genero = ?, barrio = ?, direccion = ?, ocupacion = ?, empresa = ?
          WHERE user_id = ?`,
        [
          telefono || null, ciudad || null, pais || null, departamento || null,
          tipo_documento || null, numero_documento || null, normalizedFechaNacimiento,
          genero || null, barrio || null, direccion || null, ocupacion || null, empresa || null,
          id
        ]
      );
    } else {
      // Solo insertar si hay al menos un campo con valor
      if (telefono || ciudad || pais || departamento || tipo_documento || numero_documento || 
          fecha_nacimiento || genero || barrio || direccion || ocupacion || empresa) {
        await query(
          `INSERT INTO user_profiles 
            (user_id, telefono, ciudad, pais, departamento, tipo_documento, numero_documento,
             fecha_nacimiento, genero, barrio, direccion, ocupacion, empresa)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, telefono || null, ciudad || null, pais || null, departamento || null,
            tipo_documento || null, numero_documento || null, normalizedFechaNacimiento,
            genero || null, barrio || null, direccion || null, ocupacion || null, empresa || null
          ]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Usuario actualizado exitosamente' });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
