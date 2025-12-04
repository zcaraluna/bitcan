import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; appId: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener la postulación
    const application = await queryOne(
      'SELECT user_id, course_id FROM course_applications WHERE id = ?',
      [params.appId]
    );

    if (!application) {
      return NextResponse.json({ error: 'Postulación no encontrada' }, { status: 404 });
    }

    try {
      await connection.beginTransaction();

      // Actualizar estado de la postulación
      await connection.execute(
        "UPDATE course_applications SET status = 'approved', reviewed_at = NOW(), reviewed_by = ? WHERE id = ?",
        [decoded.id, params.appId]
      );

      // Verificar si el estudiante ya está inscrito
      const [existingRows] = await connection.execute(
        'SELECT id FROM user_courses WHERE user_id = ? AND course_id = ?',
        [application.user_id, application.course_id]
      );
      const existing = Array.isArray(existingRows) && existingRows.length > 0 ? existingRows[0] : null;

      if (!existing) {
        // Inscribir al estudiante
        await connection.execute(
          'INSERT INTO user_courses (user_id, course_id, started_at, progress, completed) VALUES (?, ?, NOW(), 0, 0)',
          [application.user_id, application.course_id]
        );
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Postulación aprobada y estudiante inscrito'
      });

    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error approving application:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














