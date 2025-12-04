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
    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '10');

    // Obtener postulaciones pendientes (solo para visualización)
    // LIMIT debe ser un valor literal, no un parámetro
    const applications = await query(`
      SELECT 
        ca.*, 
        u.name as estudiante_nombre, 
        u.email as estudiante_email, 
        c.title as curso_nombre
      FROM course_applications ca
      JOIN users u ON ca.user_id = u.id
      JOIN courses c ON ca.course_id = c.id
      JOIN course_instructors ci ON c.id = ci.course_id
      WHERE ci.instructor_id = ? AND ca.status = 'pending'
      ORDER BY ca.application_date DESC
      LIMIT ${limit}
    `, [instructorId]);

    return NextResponse.json({
      success: true,
      data: applications,
    });

  } catch (error) {
    console.error('Error fetching pending applications:', error);
    return NextResponse.json(
      { error: 'Error al obtener postulaciones pendientes' },
      { status: 500 }
    );
  }
}

