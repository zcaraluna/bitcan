import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(
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

    // Obtener información del estudiante
    const student = await queryOne(`
      SELECT id, name, email
      FROM users
      WHERE id = ? AND role = 'estudiante'
    `, [studentId]);

    if (!student) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el estudiante esté inscrito en el curso
    const enrollmentCheck = await queryOne(`
      SELECT uc.user_id
      FROM user_courses uc
      JOIN quizzes q ON uc.course_id = q.course_id
      WHERE uc.user_id = ? AND q.id = ?
    `, [studentId, quizId]);

    if (!enrollmentCheck) {
      return NextResponse.json(
        { error: 'El estudiante no está inscrito en este curso' },
        { status: 403 }
      );
    }

    // Obtener resultado del quiz del estudiante
    const result = await queryOne(`
      SELECT qr.*
      FROM quiz_results qr
      WHERE qr.quiz_id = ? AND qr.user_id = ?
      ORDER BY qr.completed_at DESC
      LIMIT 1
    `, [quizId, studentId]);

    if (!result) {
      return NextResponse.json(
        { error: 'El estudiante no ha completado este quiz aún' },
        { status: 404 }
      );
    }

    // Obtener preguntas del quiz
    const questions = await query(`
      SELECT DISTINCT *
      FROM quiz_questions
      WHERE quiz_id = ?
      ORDER BY sort_order ASC, id ASC
    `, [quizId]);

    // Obtener opciones para cada pregunta
    const questionsWithOptions = await Promise.all(
      questions.map(async (question: any) => {
        const options = await query(`
          SELECT *
          FROM quiz_options
          WHERE question_id = ?
          ORDER BY id ASC
        `, [question.id]);

        return {
          ...question,
          options: options.map((opt: any) => ({
            id: opt.id,
            text: opt.option_text,
            is_correct: opt.is_correct,
          })),
        };
      })
    );

    // Decodificar respuestas del estudiante
    const answersJson = JSON.parse(result.answers || '{}');

    // Obtener calificaciones manuales existentes
    const manualGrades = await query(`
      SELECT 
        qmg.question_id,
        qmg.awarded_points,
        qmg.feedback
      FROM quiz_manual_grades qmg
      WHERE qmg.quiz_result_id = ?
    `, [result.id]);

    // Crear un objeto con las calificaciones manuales por pregunta
    const manualGradesByQuestion: Record<number, { awarded_points: number; feedback?: string }> = {};
    for (const grade of manualGrades) {
      manualGradesByQuestion[grade.question_id] = {
        awarded_points: grade.awarded_points,
        feedback: grade.feedback || undefined,
      };
    }

    // Calcular porcentaje
    const percentage = result.max_score > 0
      ? Math.round((result.score / result.max_score) * 100 * 10) / 10
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        quiz: quizCheck,
        student,
        result: {
          ...result,
          percentage,
        },
        questions: questionsWithOptions,
        student_answers: answersJson,
        manual_grades: manualGradesByQuestion,
      }
    });

  } catch (error) {
    console.error('Error fetching student quiz answers:', error);
    return NextResponse.json(
      { error: 'Error al obtener las respuestas del estudiante' },
      { status: 500 }
    );
  }
}

