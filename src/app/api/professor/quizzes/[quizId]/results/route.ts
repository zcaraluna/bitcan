import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
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
    const quizId = parseInt(params.quizId);

    // Verificar que el profesor tenga acceso al quiz
    const quizCheck = await queryOne(`
      SELECT q.*, c.title as course_title, c.id as course_id
      FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      JOIN course_instructors ci ON c.id = ci.course_id
      WHERE q.id = ? AND ci.instructor_id = ?
    `, [quizId, professorId]);

    if (!quizCheck) {
      return NextResponse.json(
        { error: 'Quiz no encontrado o sin permisos' },
        { status: 403 }
      );
    }

    // Obtener todos los resultados del quiz
    const results = await query(`
      SELECT 
        qr.*,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email
      FROM quiz_results qr
      JOIN users u ON qr.user_id = u.id
      WHERE qr.quiz_id = ?
      ORDER BY qr.completed_at DESC
    `, [quizId]);

    // Calcular porcentajes para cada resultado
    const resultsWithPercentage = results.map((result: any) => ({
      ...result,
      percentage: result.max_score > 0
        ? Math.round((result.score / result.max_score) * 100 * 10) / 10
        : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        quiz: quizCheck,
        results: resultsWithPercentage,
      }
    });

  } catch (error) {
    console.error('Error fetching quiz results:', error);
    return NextResponse.json(
      { error: 'Error al obtener los resultados del quiz' },
      { status: 500 }
    );
  }
}

