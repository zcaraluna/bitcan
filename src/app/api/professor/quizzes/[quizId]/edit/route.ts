import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

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

    // Verificar que el profesor es instructor del curso
    const quiz = await queryOne(`
      SELECT q.*, c.title as course_title, c.id as course_id, cc.name as category_name
      FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      LEFT JOIN course_categories cc ON c.category_id = cc.id
      JOIN course_instructors ci ON c.id = ci.course_id
      WHERE q.id = ? AND ci.instructor_id = ?
    `, [quizId, professorId]);

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz no encontrado o no tienes permisos' },
        { status: 403 }
      );
    }

    // Obtener preguntas
    const questions = await query(`
      SELECT qq.*, COUNT(qo.id) as options_count
      FROM quiz_questions qq
      LEFT JOIN quiz_options qo ON qq.id = qo.question_id
      WHERE qq.quiz_id = ?
      GROUP BY qq.id
      ORDER BY qq.sort_order ASC
    `, [quizId]);

    // Obtener opciones para cada pregunta
    const optionsByQuestion: Record<number, any[]> = {};
    for (const question of questions) {
      const options = await query(`
        SELECT id, question_id, option_text, is_correct, sort_order
        FROM quiz_options 
        WHERE question_id = ? 
        ORDER BY sort_order ASC
      `, [question.id]);
      optionsByQuestion[question.id] = options || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        quiz,
        questions,
        optionsByQuestion,
      }
    });

  } catch (error) {
    console.error('Error fetching quiz for edit:', error);
    return NextResponse.json(
      { error: 'Error al obtener el quiz' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await request.json();

    // Verificar permisos
    const quizCheck = await queryOne(`
      SELECT q.* FROM quizzes q
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

    const { title, description, passing_score, time_limit_minutes, is_required, start_datetime, end_datetime, results_publish_datetime } = body;

    // Validaciones
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Título y descripción son obligatorios' },
        { status: 400 }
      );
    }

    if (passing_score < 0 || passing_score > 100) {
      return NextResponse.json(
        { error: 'El puntaje mínimo debe estar entre 0 y 100' },
        { status: 400 }
      );
    }

    // Actualizar quiz
    await query(`
      UPDATE quizzes 
      SET title = ?, description = ?, passing_score = ?, time_limit_minutes = ?, is_required = ?,
          start_datetime = ?, end_datetime = ?, results_publish_datetime = ?
      WHERE id = ?
    `, [
      title.trim(),
      description.trim(),
      passing_score,
      time_limit_minutes || null,
      is_required ? 1 : 0,
      start_datetime || null,
      end_datetime || null,
      results_publish_datetime || null,
      quizId,
    ]);

    return NextResponse.json({
      success: true,
      message: 'Quiz actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el quiz' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Verificar permisos
    const quizCheck = await queryOne(`
      SELECT q.* FROM quizzes q
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

    // Determinar si es FormData o JSON
    const contentType = request.headers.get('content-type') || '';
    let action: string;
    let formData: FormData | null = null;
    let jsonData: any = null;

    if (contentType.includes('multipart/form-data')) {
      formData = await request.formData();
      action = formData.get('action') as string;
    } else {
      jsonData = await request.json();
      action = jsonData.action;
    }

    switch (action) {
      case 'add_question': {
        if (!formData) {
          return NextResponse.json(
            { error: 'FormData requerido para agregar pregunta' },
            { status: 400 }
          );
        }
        const question_text = formData.get('question_text') as string;
        const question_type = formData.get('question_type') as string;
        const points = parseFloat(formData.get('points') as string);
        const require_justification = formData.get('require_justification') === '1';
        const question_file = formData.get('question_file') as File | null;

        if (!question_text || !question_type || !points) {
          return NextResponse.json(
            { error: 'Faltan campos obligatorios' },
            { status: 400 }
          );
        }

        let file_path = null;
        if (question_file && question_file.size > 0) {
          const uploadDir = join(process.cwd(), 'public', 'uploads', 'quiz_files');
          await mkdir(uploadDir, { recursive: true });
          
          const uniqueName = `${Date.now()}_${question_file.name}`;
          const filePath = join(uploadDir, uniqueName);
          const bytes = await question_file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          await writeFile(filePath, buffer);
          
          file_path = `/uploads/quiz_files/${uniqueName}`;
        }

        // Obtener el siguiente sort_order
        const maxOrder = await queryOne(`
          SELECT COALESCE(MAX(sort_order), 0) as max_order
          FROM quiz_questions
          WHERE quiz_id = ?
        `, [quizId]);

        const sort_order = (maxOrder?.max_order || 0) + 1;

        await query(`
          INSERT INTO quiz_questions (quiz_id, question, question_type, points, sort_order, require_justification, file_path)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [quizId, question_text.trim(), question_type, points, sort_order, require_justification ? 1 : 0, file_path]);

        return NextResponse.json({
          success: true,
          message: 'Pregunta agregada exitosamente'
        });
      }

      case 'add_option': {
        if (!jsonData) {
          return NextResponse.json(
            { error: 'JSON requerido para agregar opción' },
            { status: 400 }
          );
        }
        const { question_id, option_text, is_correct } = jsonData;

        if (!question_id || !option_text) {
          return NextResponse.json(
            { error: 'Faltan campos obligatorios' },
            { status: 400 }
          );
        }

        // Verificar que la pregunta pertenece al quiz
        const questionCheck = await queryOne(`
          SELECT id, question_type FROM quiz_questions
          WHERE id = ? AND quiz_id = ?
        `, [question_id, quizId]);

        if (!questionCheck) {
          return NextResponse.json(
            { error: 'Pregunta no encontrada' },
            { status: 404 }
          );
        }

        // Validación para single_choice: solo puede haber una opción correcta
        if (questionCheck.question_type === 'single_choice' && is_correct) {
          const existingCorrect = await queryOne(`
            SELECT id FROM quiz_options
            WHERE question_id = ? AND is_correct = 1
          `, [question_id]);

          if (existingCorrect) {
            return NextResponse.json(
              { error: 'Las preguntas de selección única solo pueden tener una opción correcta. Desmarca la opción correcta actual antes de marcar otra.' },
              { status: 400 }
            );
          }
        }

        // Nota: Las preguntas de selección múltiple pueden tener múltiples respuestas correctas
        // Solo validamos para true_false que debe tener exactamente 2 opciones (Verdadero y Falso)

        // Obtener el siguiente sort_order
        const maxOrder = await queryOne(`
          SELECT COALESCE(MAX(sort_order), 0) as max_order
          FROM quiz_options
          WHERE question_id = ?
        `, [question_id]);

        const sort_order = (maxOrder?.max_order || 0) + 1;

        await query(`
          INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order)
          VALUES (?, ?, ?, ?)
        `, [question_id, option_text.trim(), is_correct ? 1 : 0, sort_order]);

        return NextResponse.json({
          success: true,
          message: 'Opción agregada exitosamente'
        });
      }

      case 'delete_question': {
        if (!jsonData) {
          return NextResponse.json(
            { error: 'JSON requerido para eliminar pregunta' },
            { status: 400 }
          );
        }
        const { question_id } = jsonData;

        // Obtener información del archivo
        const question = await queryOne(`
          SELECT file_path FROM quiz_questions
          WHERE id = ? AND quiz_id = ?
        `, [question_id, quizId]);

        if (!question) {
          return NextResponse.json(
            { error: 'Pregunta no encontrada' },
            { status: 404 }
          );
        }

        // Eliminar opciones
        await query(`DELETE FROM quiz_options WHERE question_id = ?`, [question_id]);

        // Eliminar pregunta
        await query(`DELETE FROM quiz_questions WHERE id = ? AND quiz_id = ?`, [question_id, quizId]);

        // Eliminar archivo físico si existe
        if (question.file_path) {
          try {
            const filePath = join(process.cwd(), 'public', question.file_path);
            await unlink(filePath);
          } catch (error) {
            console.error('Error deleting file:', error);
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Pregunta eliminada exitosamente'
        });
      }

      case 'delete_option': {
        if (!jsonData) {
          return NextResponse.json(
            { error: 'JSON requerido para eliminar opción' },
            { status: 400 }
          );
        }
        const { option_id } = jsonData;

        await query(`DELETE FROM quiz_options WHERE id = ?`, [option_id]);

        return NextResponse.json({
          success: true,
          message: 'Opción eliminada exitosamente'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing quiz edit action:', error);
    return NextResponse.json(
      { error: 'Error al procesar la acción' },
      { status: 500 }
    );
  }
}

