import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener cursos con paginación y filtros
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
    const statusFilter = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    // Construir condiciones WHERE
    const whereConditions = [];
    const params = [];

    if (search) {
      whereConditions.push(`
        (c.title LIKE ? OR c.description LIKE ? OR c.identifier LIKE ?)
      `);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (statusFilter) {
      whereConditions.push('c.status = ?');
      params.push(statusFilter);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Contar total de cursos
    const countSql = `
      SELECT COUNT(*) as total 
      FROM courses c 
      ${whereClause}
    `;
    const countResult = await queryOne<{ total: number }>(countSql, params);
    const totalCourses = countResult?.total || 0;
    const totalPages = Math.ceil(totalCourses / limit);

    // Obtener cursos
    let coursesSql: string;
    let queryParams: any[];

    if (whereConditions.length > 0) {
      coursesSql = `
        SELECT 
          c.*,
          COUNT(DISTINCT uc.user_id) as total_students,
          COUNT(DISTINCT l.id) as total_lessons,
          GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') as instructors
        FROM courses c
        LEFT JOIN course_instructors ci ON c.id = ci.course_id
        LEFT JOIN users u ON ci.instructor_id = u.id
        LEFT JOIN user_courses uc ON c.id = uc.course_id
        LEFT JOIN lessons l ON c.id = l.course_id
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `;
      queryParams = [...params, limit.toString(), offset.toString()];
    } else {
      coursesSql = `
        SELECT 
          c.*,
          COUNT(DISTINCT uc.user_id) as total_students,
          COUNT(DISTINCT l.id) as total_lessons,
          GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') as instructors
        FROM courses c
        LEFT JOIN course_instructors ci ON c.id = ci.course_id
        LEFT JOIN users u ON ci.instructor_id = u.id
        LEFT JOIN user_courses uc ON c.id = uc.course_id
        LEFT JOIN lessons l ON c.id = l.course_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `;
      queryParams = [limit.toString(), offset.toString()];
    }

    const courses = await query(coursesSql, queryParams);

    return NextResponse.json({
      success: true,
      courses,
      totalCourses,
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo curso
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
    const {
      title,
      identifier,
      short_description,
      description,
      category_id,
      level,
      status,
      duration_hours,
      duration_minutes,
      price,
      price_pyg,
      is_free,
      enrollment_start_date,
      enrollment_end_date,
      course_start_date,
      course_end_date,
      max_students,
      requires_approval,
      is_featured,
      is_published,
      sort_order,
      requirements,
      learning_objectives,
      thumbnail_url,
      video_url,
      payment_bank,
      payment_account,
      payment_holder,
      payment_id,
      payment_ruc,
      payment_alias,
      payment_whatsapp,
      payment_crypto_wallet,
      payment_crypto_network,
      payment_crypto_currency,
      instructor_ids,
      exchange_rate_usd,
      exchange_rate_ars,
      exchange_rate_brl,
    } = body;

    // Validaciones
    if (!title || !description || !identifier || !category_id || !instructor_ids || instructor_ids.length === 0) {
      return NextResponse.json(
        { error: 'Por favor completa todos los campos requeridos' },
        { status: 400 }
      );
    }

    // Validar formato del identificador (2 números + 2 letras)
    if (!/^[0-9]{2}[A-Z]{2}$/.test(identifier)) {
      return NextResponse.json(
        { error: 'El identificador debe tener el formato: 2 números + 2 letras (ej: 12AB)' },
        { status: 400 }
      );
    }

    // Verificar que el identificador sea único
    const identifierCheck = await queryOne(
      'SELECT id FROM courses WHERE identifier = ?',
      [identifier]
    );

    if (identifierCheck) {
      return NextResponse.json(
        { error: 'El identificador ya existe. Por favor genera uno nuevo.' },
        { status: 400 }
      );
    }

    // Verificar que todos los instructores sean profesores
    if (instructor_ids && instructor_ids.length > 0) {
      const placeholders = instructor_ids.map(() => '?').join(',');
      const instructors = await query(
        `SELECT id, role FROM users WHERE id IN (${placeholders})`,
        instructor_ids
      );

      for (const instructor of instructors) {
        if (instructor.role !== 'profesor') {
          return NextResponse.json(
            { error: 'Todos los instructores deben ser profesores' },
            { status: 400 }
          );
        }
      }
    }

    // Generar slug único
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Verificar si el slug ya existe
    let finalSlug = slug;
    let counter = 1;
    while (true) {
      const slugCheck = await queryOne(
        'SELECT id FROM courses WHERE slug = ?',
        [finalSlug]
      );
      if (!slugCheck) break;
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // Crear el curso
    const result = await query(
      `INSERT INTO courses (
        title, identifier, slug, short_description, description, category_id, level, status,
        duration_hours, duration_minutes, price, price_pyg, is_free, 
        exchange_rate_usd, exchange_rate_ars, exchange_rate_brl, rates_snapshot_at,
        enrollment_start_date, enrollment_end_date, course_start_date, course_end_date, 
        max_students, requires_approval, is_featured, is_published,
        sort_order, requirements, learning_objectives, thumbnail_url, video_url,
        payment_bank, payment_account, payment_holder, payment_id, payment_ruc, payment_alias, payment_whatsapp,
        payment_crypto_wallet, payment_crypto_network, payment_crypto_currency,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title,
        identifier,
        finalSlug,
        short_description || '',
        description,
        category_id,
        level || 'beginner',
        status || 'activo',
        duration_hours || 0,
        duration_minutes || 0,
        price || 0,
        price_pyg || 0,
        is_free ? 1 : 0,
        exchange_rate_usd || 7300,
        exchange_rate_ars || 7.50,
        exchange_rate_brl || 1450,
        enrollment_start_date || null,
        enrollment_end_date || null,
        course_start_date || null,
        course_end_date || null,
        max_students || null,
        requires_approval ? 1 : 0,
        is_featured ? 1 : 0,
        is_published ? 1 : 0,
        sort_order || 0,
        requirements || '',
        learning_objectives || '',
        thumbnail_url || '',
        video_url || '',
        payment_bank || '',
        payment_account || '',
        payment_holder || '',
        payment_id || '',
        payment_ruc || '',
        payment_alias || '',
        payment_whatsapp || '',
        payment_crypto_wallet || '',
        payment_crypto_network || '',
        payment_crypto_currency || '',
      ]
    );

    const courseId = (result as any).insertId;

    // Asignar instructores
    if (instructor_ids && instructor_ids.length > 0) {
      for (let index = 0; index < instructor_ids.length; index++) {
        const instructorId = instructor_ids[index];
        const isLead = index === 0 ? 1 : 0;
        const role = isLead ? 'principal' : 'coordinador';
        
        await query(
          'INSERT INTO course_instructors (course_id, instructor_id, role, is_lead_instructor) VALUES (?, ?, ?, ?)',
          [courseId, instructorId, role, isLead]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Curso creado exitosamente',
      courseId
    });

  } catch (error: any) {
    console.error('Error creating course:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlMessage: error?.sqlMessage,
      sql: error?.sql
    });
    
    // Devolver mensaje más específico
    let errorMessage = 'Error interno del servidor';
    if (error?.sqlMessage) {
      errorMessage = `Error de base de datos: ${error.sqlMessage}`;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT - Actualizar curso
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
      title,
      identifier,
      short_description,
      description,
      category_id,
      level,
      status,
      duration_hours,
      duration_minutes,
      price,
      price_pyg,
      is_free,
      exchange_rate_usd,
      exchange_rate_ars,
      exchange_rate_brl,
      enrollment_start_date,
      enrollment_end_date,
      course_start_date,
      course_end_date,
      max_students,
      requires_approval,
      is_featured,
      is_published,
      sort_order,
      requirements,
      learning_objectives,
      thumbnail_url,
      video_url,
      payment_bank,
      payment_account,
      payment_holder,
      payment_id,
      payment_ruc,
      payment_alias,
      payment_whatsapp,
      payment_crypto_wallet,
      payment_crypto_network,
      payment_crypto_currency,
      instructor_ids,
    } = body;

    // Validaciones
    if (!id || !title || !description) {
      return NextResponse.json(
        { error: 'ID, título y descripción son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el identificador sea único (excluyendo el curso actual)
    if (identifier) {
      const identifierCheck = await queryOne(
        'SELECT id FROM courses WHERE identifier = ? AND id != ?',
        [identifier, id]
      );

      if (identifierCheck) {
        return NextResponse.json(
          { error: 'El identificador ya existe. Por favor genera uno nuevo.' },
          { status: 400 }
        );
      }
    }

    // Verificar que todos los instructores sean profesores
    if (instructor_ids && instructor_ids.length > 0) {
      const placeholders = instructor_ids.map(() => '?').join(',');
      const instructors = await query(
        `SELECT id, role FROM users WHERE id IN (${placeholders})`,
        instructor_ids
      );

      for (const instructor of instructors) {
        if (instructor.role !== 'profesor') {
          return NextResponse.json(
            { error: 'Todos los instructores deben ser profesores' },
            { status: 400 }
          );
        }
      }
    }

    // Actualizar el curso
    await query(
      `UPDATE courses SET 
        title = ?, identifier = ?, short_description = ?, description = ?, category_id = ?, level = ?, status = ?,
        duration_hours = ?, duration_minutes = ?, price = ?, price_pyg = ?, is_free = ?, 
        exchange_rate_usd = ?, exchange_rate_ars = ?, exchange_rate_brl = ?, rates_snapshot_at = NOW(),
        enrollment_start_date = ?, enrollment_end_date = ?, course_start_date = ?, course_end_date = ?, max_students = ?, requires_approval = ?, is_featured = ?, is_published = ?,
        sort_order = ?, requirements = ?, learning_objectives = ?, thumbnail_url = ?, video_url = ?,
        payment_bank = ?, payment_account = ?, payment_holder = ?, payment_id = ?, payment_ruc = ?, payment_alias = ?, payment_whatsapp = ?,
        payment_crypto_wallet = ?, payment_crypto_network = ?, payment_crypto_currency = ?,
        updated_at = NOW()
        WHERE id = ?`,
      [
        title,
        identifier,
        short_description || '',
        description,
        category_id,
        level || 'beginner',
        status,
        duration_hours || 0,
        duration_minutes || 0,
        price || 0,
        price_pyg || 0,
        is_free ? 1 : 0,
        exchange_rate_usd || 7300,
        exchange_rate_ars || 7.50,
        exchange_rate_brl || 1450,
        enrollment_start_date || null,
        enrollment_end_date || null,
        course_start_date || null,
        course_end_date || null,
        max_students || null,
        requires_approval ? 1 : 0,
        is_featured ? 1 : 0,
        is_published ? 1 : 0,
        sort_order || 0,
        requirements || '',
        learning_objectives || '',
        thumbnail_url || '',
        video_url || '',
        payment_bank || '',
        payment_account || '',
        payment_holder || '',
        payment_id || '',
        payment_ruc || '',
        payment_alias || '',
        payment_whatsapp || '',
        payment_crypto_wallet || '',
        payment_crypto_network || '',
        payment_crypto_currency || '',
        id
      ]
    );

    // Actualizar instructores
    await query('DELETE FROM course_instructors WHERE course_id = ?', [id]);
    
    if (instructor_ids && instructor_ids.length > 0) {
      for (let index = 0; index < instructor_ids.length; index++) {
        const instructorId = instructor_ids[index];
        const isLead = index === 0 ? 1 : 0;
        const role = isLead ? 'principal' : 'coordinador';
        
        await query(
          'INSERT INTO course_instructors (course_id, instructor_id, role, is_lead_instructor) VALUES (?, ?, ?, ?)',
          [id, instructorId, role, isLead]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Curso actualizado exitosamente'
    });

  } catch (error: any) {
    console.error('Error updating course:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlMessage: error?.sqlMessage,
      sql: error?.sql
    });
    
    let errorMessage = 'Error interno del servidor';
    if (error?.sqlMessage) {
      errorMessage = `Error de base de datos: ${error.sqlMessage}`;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar curso
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
    const { course_id } = body;

    if (!course_id) {
      return NextResponse.json(
        { error: 'ID de curso requerido' },
        { status: 400 }
      );
    }

    // Eliminar relaciones primero
    await query('DELETE FROM course_instructors WHERE course_id = ?', [course_id]);
    await query('DELETE FROM user_courses WHERE course_id = ?', [course_id]);
    await query('DELETE FROM lessons WHERE course_id = ?', [course_id]);

    // Eliminar el curso
    await query('DELETE FROM courses WHERE id = ?', [course_id]);

    return NextResponse.json({
      success: true,
      message: 'Curso eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
