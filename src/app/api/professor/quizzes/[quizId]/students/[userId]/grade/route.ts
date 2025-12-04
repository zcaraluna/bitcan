import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { quizId: string; userId: string } }
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
    const studentId = parseInt(params.userId);

    const body = await request.json();
    const { question_id, awarded_points, feedback } = body;

    if (!question_id || awarded_points === undefined) {
      return NextResponse.json(
        { error: 'question_id y awarded_points son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el profesor tenga acceso al quiz
    const quizCheck = await queryOne(`
      SELECT q.id
      FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      JOIN course_instructors ci ON c.id = ci.course_id
      WHERE q.id = ? AND ci.instructor_id = ?
    `, [quizId, professorId]);

    if (!quizCheck) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este quiz' },
        { status: 403 }
      );
    }

    // Obtener el quiz_result_id
    const quizResult = await queryOne(`
      SELECT id FROM quiz_results
      WHERE quiz_id = ? AND user_id = ?
      ORDER BY completed_at DESC
      LIMIT 1
    `, [quizId, studentId]);

    if (!quizResult) {
      return NextResponse.json(
        { error: 'No se encontró el resultado del quiz para este estudiante' },
        { status: 404 }
      );
    }

    // Verificar si ya existe una calificación manual
    const existingGrade = await queryOne(`
      SELECT id FROM quiz_manual_grades
      WHERE quiz_result_id = ? AND question_id = ?
    `, [quizResult.id, question_id]);

    // Obtener los puntos máximos de la pregunta
    const questionData = await queryOne(`
      SELECT points FROM quiz_questions WHERE id = ?
    `, [question_id]);
    const maxPoints = questionData?.points || 0;

    if (existingGrade) {
      // Actualizar calificación existente
      await query(`
        UPDATE quiz_manual_grades
        SET awarded_points = ?, feedback = ?, updated_at = NOW()
        WHERE id = ?
      `, [awarded_points, feedback || null, existingGrade.id]);
    } else {
      // Crear nueva calificación manual
      await query(`
        INSERT INTO quiz_manual_grades
        (quiz_result_id, question_id, awarded_points, max_points, feedback, graded_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [quizResult.id, question_id, awarded_points, maxPoints, feedback || null, professorId]);
    }

    // Recalcular el puntaje total del quiz
    const manualScores = await queryOne(`
      SELECT COALESCE(SUM(qmg.awarded_points), 0) as manual_score
      FROM quiz_manual_grades qmg
      WHERE qmg.quiz_result_id = ?
    `, [quizResult.id]);

    // Obtener las respuestas del estudiante para el recálculo
    const resultData = await queryOne(`
      SELECT answers FROM quiz_results WHERE id = ?
    `, [quizResult.id]);
    const answersJson = JSON.parse(resultData?.answers || '{}');

    // Calcular puntaje automático
    let autoScore = 0;
    const allQuestions = await query(`
      SELECT qq.id, qq.question_type, qq.points, qq.require_justification
      FROM quiz_questions qq
      WHERE qq.quiz_id = ?
    `, [quizId]);

    for (const q of allQuestions) {
      const qId = q.id;
      const studentAnswer = answersJson[qId] ?? null;

      // Solo calcular automático si no es pregunta manual
      const isManual = (q.question_type === 'text' ||
        (q.question_type === 'true_false' && q.require_justification));

      if (!isManual) {
        let pointsEarned = 0;

        if (q.question_type === 'multiple_choice' || q.question_type === 'single_choice') {
          const options = await query(`
            SELECT id, is_correct FROM quiz_options WHERE question_id = ?
          `, [qId]);

          const selectedAnswer = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];
          let correctAnswers = 0;
          let totalCorrect = 0;

          for (const option of options) {
            if (option.is_correct) {
              totalCorrect++;
              if (selectedAnswer.includes(option.id.toString())) {
                correctAnswers++;
              }
            }
          }

          if (totalCorrect > 0) {
            const questionPoints = typeof q.points === 'number' ? q.points : parseFloat(q.points || 0) || 0;
            pointsEarned = (correctAnswers / totalCorrect) * questionPoints;
          }
        } else if (q.question_type === 'true_false') {
          const answerText = (Array.isArray(studentAnswer) && typeof studentAnswer[0] === 'object' && studentAnswer[0]?.answer)
            ? studentAnswer[0].answer
            : (typeof studentAnswer === 'object' && studentAnswer?.answer)
            ? studentAnswer.answer
            : studentAnswer;
          const options = await query(`
            SELECT option_text, is_correct FROM quiz_options WHERE question_id = ?
          `, [qId]);

          for (const option of options) {
            if (option.is_correct && option.option_text === answerText) {
              const questionPoints = typeof q.points === 'number' ? q.points : parseFloat(q.points || 0) || 0;
              pointsEarned = questionPoints;
              break;
            }
          }
        }

        // Asegurar que pointsEarned sea un número antes de usar toFixed
        const points = typeof pointsEarned === 'number' && !isNaN(pointsEarned) 
          ? pointsEarned 
          : parseFloat(String(pointsEarned || 0)) || 0;
        autoScore += parseFloat(points.toFixed(2)) || 0;
      }
    }
    
    // Asegurar que autoScore sea un número
    autoScore = typeof autoScore === 'number' && !isNaN(autoScore)
      ? parseFloat(autoScore.toFixed(2))
      : 0;

    // Asegurar que los valores sean números
    const manualScore = typeof manualScores?.manual_score === 'number' 
      ? manualScores.manual_score 
      : parseFloat(String(manualScores?.manual_score || 0)) || 0;
    
    // Asegurar que ambos sean números antes de sumar y usar toFixed
    const sum = (typeof autoScore === 'number' ? autoScore : 0) + (typeof manualScore === 'number' ? manualScore : 0);
    const totalScore = typeof sum === 'number' && !isNaN(sum)
      ? parseFloat(sum.toFixed(2))
      : 0;

    // Obtener max_score del resultado
    const maxScoreResult = await queryOne(`
      SELECT max_score FROM quiz_results WHERE id = ?
    `, [quizResult.id]);
    const maxScore = typeof maxScoreResult?.max_score === 'number' 
      ? maxScoreResult.max_score 
      : parseFloat(maxScoreResult?.max_score || 0) || 0;

    // Calcular porcentaje y si aprobó
    const percentage = maxScore > 0
      ? Math.round((totalScore / maxScore) * 100 * 10) / 10
      : 0;

    // Obtener passing_score del quiz
    const quizData = await queryOne(`
      SELECT passing_score FROM quizzes WHERE id = ?
    `, [quizId]);
    const passingScore = typeof quizData?.passing_score === 'number'
      ? quizData.passing_score
      : parseFloat(quizData?.passing_score || 60) || 60;
    const passed = percentage >= passingScore;

    // Actualizar el puntaje total en quiz_results
    // Asegurar que totalScore sea un número puro, no una cadena formateada
    await query(`
      UPDATE quiz_results
      SET score = ?, passed = ?, needs_manual_grading = 0
      WHERE id = ?
    `, [totalScore, passed ? 1 : 0, quizResult.id]);

    return NextResponse.json({
      success: true,
      message: 'Calificación actualizada correctamente',
      data: {
        total_score: totalScore,
        max_score: maxScore,
        percentage,
        passed,
      }
    });

  } catch (error) {
    console.error('Error grading quiz:', error);
    return NextResponse.json(
      { error: 'Error al calificar el quiz' },
      { status: 500 }
    );
  }
}

