import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'profesor') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const instructorId = decoded.id;

    // Obtener todos los resultados pendientes de calificación manual
    const pendingResults = await query(`
      SELECT 
        qr.id as result_id,
        qr.quiz_id,
        qr.user_id,
        qr.score,
        qr.max_score,
        qr.completed_at,
        q.title as quiz_title,
        q.description as quiz_description,
        c.id as course_id,
        c.title as course_title,
        u.name as student_name,
        u.email as student_email
      FROM quiz_results qr
      JOIN quizzes q ON qr.quiz_id = q.id
      JOIN courses c ON q.course_id = c.id
      JOIN course_instructors ci ON c.id = ci.course_id
      JOIN users u ON qr.user_id = u.id
      WHERE ci.instructor_id = ? AND qr.needs_manual_grading = 1
      ORDER BY qr.completed_at DESC
    `, [instructorId]);

    return NextResponse.json({
      success: true,
      data: Array.isArray(pendingResults) ? pendingResults : [],
    });

  } catch (error) {
    console.error('Error fetching pending quiz results:', error);
    return NextResponse.json(
      { error: 'Error al obtener resultados pendientes' },
      { status: 500 }
    );
  }
}

