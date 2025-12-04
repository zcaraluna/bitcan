import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'profesor') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const professorId = decoded.id;
    const body = await request.json();
    const { course_id, title, description, passing_score, time_limit_minutes, is_required } = body;

    // Validaciones
    if (!course_id || !title || !description) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    if (passing_score < 0 || passing_score > 100) {
      return NextResponse.json(
        { error: 'El puntaje mínimo debe estar entre 0 y 100' },
        { status: 400 }
      );
    }

    if (time_limit_minutes !== null && time_limit_minutes <= 0) {
      return NextResponse.json(
        { error: 'El límite de tiempo debe ser mayor a 0 minutos' },
        { status: 400 }
      );
    }

    // Verificar que el profesor es instructor de este curso
    const instructorCheck = await queryOne(`
      SELECT COUNT(*) as is_instructor
      FROM course_instructors 
      WHERE course_id = ? AND instructor_id = ?
    `, [course_id, professorId]);

    if (!instructorCheck || !instructorCheck.is_instructor) {
      return NextResponse.json(
        { error: 'No tienes permisos para gestionar este curso' },
        { status: 403 }
      );
    }

    // Verificar que el curso existe
    const courseCheck = await queryOne(`
      SELECT id, title FROM courses WHERE id = ?
    `, [course_id]);

    if (!courseCheck) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Crear el quiz
    const [result]: any = await pool.execute(`
      INSERT INTO quizzes (course_id, title, description, passing_score, time_limit_minutes, is_required, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      course_id,
      title.trim(),
      description.trim(),
      passing_score,
      time_limit_minutes || null,
      is_required ? 1 : 0,
    ]);

    const quizId = result.insertId;

    // Registrar en el log de auditoría
    try {
      await query(`
        INSERT INTO system_audit_log (user_id, action, details, created_at)
        VALUES (?, ?, ?, NOW())
      `, [
        professorId,
        'create_quiz',
        `Creó el quiz '${title.trim()}' en el curso '${courseCheck.title}' (ID: ${quizId})`
      ]);
    } catch (auditError) {
      // No fallar si el log falla
      console.error('Error logging audit:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: {
        quiz_id: quizId,
        message: 'Quiz creado exitosamente'
      }
    });

  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { error: 'Error al crear el quiz' },
      { status: 500 }
    );
  }
}

