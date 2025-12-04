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

    // Verificar que el estudiante esté inscrito en el curso del quiz
    const quiz = await queryOne(`
      SELECT 
        q.*, 
        c.title as course_title, 
        c.id as course_id
      FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      JOIN user_courses uc ON c.id = uc.course_id
      WHERE q.id = ? AND uc.user_id = ?
    `, [quizId, userId]);

    if (!quiz) {
      return NextResponse.json(
        { error: 'No tienes acceso a este quiz' },
        { status: 403 }
      );
    }

    // Verificar fechas del quiz
    const now = new Date();
    
    if (quiz.start_datetime) {
      const startDate = new Date(quiz.start_datetime);
      if (now < startDate) {
        return NextResponse.json(
          { 
            error: `Este quiz aún no ha comenzado. Inicia el ${startDate.toLocaleString('es-PY')}`,
            not_started: true,
            start_datetime: quiz.start_datetime
          },
          { status: 400 }
        );
      }
    }

    if (quiz.end_datetime) {
      const endDate = new Date(quiz.end_datetime);
      if (now > endDate) {
        return NextResponse.json(
          { 
            error: `Este quiz ya ha terminado. Finalizó el ${endDate.toLocaleString('es-PY')}`,
            ended: true,
            end_datetime: quiz.end_datetime
          },
          { status: 400 }
        );
      }
    }

    // Verificar si ya completó el quiz
    const existingResult = await queryOne(`
      SELECT id, score, max_score, passed, completed_at
      FROM quiz_results 
      WHERE quiz_id = ? AND user_id = ?
      ORDER BY completed_at DESC
      LIMIT 1
    `, [quizId, userId]);

    if (existingResult) {
      // Si tiene puntaje 0 y max_score 0, significa que expiró el tiempo
      if (existingResult.score === 0 && existingResult.max_score === 0) {
        return NextResponse.json(
          { 
            error: 'El tiempo del quiz ha expirado y ya no puedes completarlo',
            expired: true
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Ya has completado este quiz',
          completed: true,
          result_id: existingResult.id
        },
        { status: 400 }
      );
    }

    // Obtener preguntas del quiz con sus opciones
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

    return NextResponse.json({
      success: true,
      data: {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          time_limit_minutes: quiz.time_limit_minutes,
          passing_score: quiz.passing_score,
          course_title: quiz.course_title,
          course_id: quiz.course_id
        },
        questions: questionsWithOptions
      }
    });

  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { error: 'Error al obtener el quiz' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const body = await request.json();
    const { answers, time_taken } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Respuestas no válidas' },
        { status: 400 }
      );
    }

    // Verificar que el estudiante esté inscrito
    const enrollment = await queryOne(`
      SELECT * FROM user_courses
      WHERE user_id = ? AND course_id = ?
    `, [userId, courseId]);

    if (!enrollment) {
      return NextResponse.json(
        { error: 'No estás inscrito en este curso' },
        { status: 403 }
      );
    }

    // Verificar que no haya completado el quiz antes
    const existingResult = await queryOne(`
      SELECT id FROM quiz_results
      WHERE quiz_id = ? AND user_id = ?
      ORDER BY completed_at DESC
      LIMIT 1
    `, [quizId, userId]);

    if (existingResult) {
      return NextResponse.json(
        { error: 'Ya has completado este quiz' },
        { status: 400 }
      );
    }

    // Obtener el quiz y sus preguntas
    const quiz = await queryOne(`
      SELECT * FROM quizzes WHERE id = ?
    `, [quizId]);

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz no encontrado' },
        { status: 404 }
      );
    }

    const questions = await query(`
      SELECT 
        qq.id,
        qq.question,
        qq.question_type,
        qq.points,
        qq.require_justification
      FROM quiz_questions qq
      WHERE qq.quiz_id = ?
      ORDER BY qq.sort_order ASC
    `, [quizId]);

    // Calcular puntaje
    let maxScore = 0;
    let autoScore = 0;
    let needsManualGrading = false;
    const processedAnswers: any = {};

    for (const question of questions) {
      maxScore += parseFloat(question.points);
      const questionId = question.id;
      const answer = answers[questionId];

      if (!answer) {
        processedAnswers[questionId] = null;
        continue;
      }

      switch (question.question_type) {
        case 'single_choice': {
          const selectedOptionId = Array.isArray(answer) ? answer[0] : answer;
          processedAnswers[questionId] = selectedOptionId;

          // Obtener opciones correctas
          const options = await query(`
            SELECT id, is_correct
            FROM quiz_options
            WHERE question_id = ?
          `, [questionId]);

          const selectedOption = options.find((opt: any) => opt.id === parseInt(selectedOptionId));
          if (selectedOption && selectedOption.is_correct) {
            autoScore += parseFloat(question.points);
          }
          break;
        }
        case 'multiple_choice': {
          const selectedOptionIds = Array.isArray(answer) ? answer : [answer];
          processedAnswers[questionId] = selectedOptionIds;

          // Obtener opciones correctas
          const options = await query(`
            SELECT id, is_correct
            FROM quiz_options
            WHERE question_id = ?
          `, [questionId]);

          const correctOptions = options.filter((opt: any) => opt.is_correct);
          const selectedCorrectOptions = selectedOptionIds.filter((id: string) => {
            const option = options.find((opt: any) => opt.id === parseInt(id));
            return option && option.is_correct;
          });

          // Si todas las opciones correctas están seleccionadas y no hay opciones incorrectas seleccionadas
          if (correctOptions.length > 0 && 
              selectedCorrectOptions.length === correctOptions.length &&
              selectedOptionIds.length === correctOptions.length) {
            autoScore += parseFloat(question.points);
          }
          break;
        }

        case 'true_false':
          const trueFalseAnswer = answer.answer || answer;
          const justification = answer.justification || '';

          // Solo requiere justificación si la respuesta es "Falso" y require_justification es true
          if (question.require_justification && trueFalseAnswer === 'Falso') {
            if (justification) {
              processedAnswers[questionId] = {
                answer: trueFalseAnswer,
                justification: justification
              };
              needsManualGrading = true;
            } else {
              // Si no hay justificación pero debería haberla, marcar como null para que falle la validación
              processedAnswers[questionId] = null;
            }
          } else {
            processedAnswers[questionId] = trueFalseAnswer;

            // Obtener opción correcta
            const tfOptions = await query(`
              SELECT option_text, is_correct
              FROM quiz_options
              WHERE question_id = ?
            `, [questionId]);

            const correctOption = tfOptions.find((opt: any) => opt.is_correct);
            if (correctOption && correctOption.option_text === trueFalseAnswer) {
              autoScore += parseFloat(question.points);
            }
          }
          break;

        case 'text':
          processedAnswers[questionId] = answer;
          needsManualGrading = true;
          break;
      }
    }

    // Calcular si pasó
    const passed = maxScore > 0 ? (autoScore / maxScore) >= (quiz.passing_score / 100) : false;

    // Insertar resultado
    // time_taken viene en milisegundos, convertir a minutos
    const timeTakenMinutes = time_taken ? Math.round(time_taken / 1000 / 60) : 0;

    const connection = await import('@/lib/db').then(m => m.default);
    const [result] = await connection.execute(`
      INSERT INTO quiz_results 
        (user_id, quiz_id, score, max_score, auto_score, passed, needs_manual_grading, time_taken_minutes, answers, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      userId,
      quizId,
      autoScore,
      maxScore,
      autoScore,
      passed ? 1 : 0,
      needsManualGrading ? 1 : 0,
      timeTakenMinutes,
      JSON.stringify(processedAnswers)
    ]);

    const resultId = (result as any).insertId;

    // Verificar si los resultados están publicados
    const now = new Date();
    let resultsPublished = false;
    let publishDate = null;

    if (quiz.results_publish_datetime) {
      publishDate = new Date(quiz.results_publish_datetime);
      resultsPublished = now >= publishDate;
    } else {
      resultsPublished = true; // Si no hay fecha, publicar inmediatamente
    }

    return NextResponse.json({
      success: true,
      message: resultsPublished 
        ? 'Quiz completado exitosamente' 
        : `Quiz completado exitosamente. Los resultados estarán disponibles el ${publishDate?.toLocaleString('es-PY')}`,
      data: {
        result_id: resultId,
        score: autoScore,
        max_score: maxScore,
        passed,
        results_published: resultsPublished,
        results_publish_datetime: quiz.results_publish_datetime
      }
    });

  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { error: 'Error al enviar el quiz' },
      { status: 500 }
    );
  }
}

