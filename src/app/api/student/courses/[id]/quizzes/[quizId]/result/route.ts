import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; quizId: string } }
) {
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
    const courseId = parseInt(params.id);
    const quizId = parseInt(params.quizId);

    // Obtener información del quiz y resultado
    const result = await queryOne(`
      SELECT 
        q.*, 
        c.title as course_title, 
        c.id as course_id,
        qr.id as result_id,
        qr.score, 
        qr.max_score, 
        qr.auto_score, 
        qr.passed, 
        qr.completed_at, 
        qr.time_taken_minutes, 
        qr.answers, 
        qr.needs_manual_grading
      FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      JOIN quiz_results qr ON q.id = qr.quiz_id
      WHERE q.id = ? AND qr.user_id = ?
      ORDER BY qr.completed_at DESC
      LIMIT 1
    `, [quizId, userId]);

    if (!result) {
      return NextResponse.json(
        { error: 'No tienes acceso a este resultado' },
        { status: 404 }
      );
    }

    // Verificar si los resultados están publicados
    const now = new Date();
    let resultsPublished = true;
    if (result.results_publish_datetime) {
      const publishDate = new Date(result.results_publish_datetime);
      resultsPublished = now >= publishDate;
      if (!resultsPublished) {
        // Si no están publicados, solo devolver resumen básico sin detalles
        return NextResponse.json({
          success: true,
          data: {
            quiz: {
              id: result.id,
              title: result.title,
              description: result.description,
              passing_score: result.passing_score,
              course_title: result.course_title,
              course_id: result.course_id
            },
            result: {
              id: result.result_id,
              score: result.score,
              max_score: result.max_score,
              auto_score: result.auto_score,
              passed: result.passed,
              percentage: result.max_score > 0 
                ? Math.round((result.score / result.max_score) * 100 * 10) / 10 
                : 0,
              completed_at: result.completed_at,
              time_taken_minutes: result.time_taken_minutes,
              needs_manual_grading: result.needs_manual_grading
            },
            results_published: false,
            publish_datetime: result.results_publish_datetime
          }
        });
      }
    }

    // Obtener preguntas del quiz con opciones
    const questions = await query(`
      SELECT 
        qq.id,
        qq.question,
        qq.question_type,
        qq.points,
        qq.sort_order,
        qq.require_justification,
        qq.file_path
      FROM quiz_questions qq
      WHERE qq.quiz_id = ?
      ORDER BY qq.sort_order ASC
    `, [quizId]);

    // Obtener opciones para cada pregunta
    const questionsWithOptions = await Promise.all(
      questions.map(async (question: any) => {
        const options = await query(`
          SELECT 
            id,
            option_text,
            is_correct,
            sort_order
          FROM quiz_options
          WHERE question_id = ?
          ORDER BY sort_order ASC
        `, [question.id]);

        return {
          ...question,
          options: options
        };
      })
    );

    // Decodificar respuestas del estudiante
    let studentAnswers: any = {};
    try {
      studentAnswers = typeof result.answers === 'string' 
        ? JSON.parse(result.answers) 
        : result.answers;
    } catch (e) {
      studentAnswers = {};
    }

    // Calcular porcentaje
    const percentage = result.max_score > 0 
      ? Math.round((result.score / result.max_score) * 100 * 10) / 10 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        quiz: {
          id: result.id,
          title: result.title,
          description: result.description,
          passing_score: result.passing_score,
          course_title: result.course_title,
          course_id: result.course_id
        },
        result: {
          id: result.result_id,
          score: result.score,
          max_score: result.max_score,
          auto_score: result.auto_score,
          passed: result.passed,
          percentage,
          completed_at: result.completed_at,
          time_taken_minutes: result.time_taken_minutes,
          needs_manual_grading: result.needs_manual_grading
        },
        questions: questionsWithOptions,
        student_answers: studentAnswers,
        results_published: true
      }
    });

  } catch (error) {
    console.error('Error fetching quiz result:', error);
    return NextResponse.json(
      { error: 'Error al obtener el resultado del quiz' },
      { status: 500 }
    );
  }
}

