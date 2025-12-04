import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Verificar que el estudiante no esté ya inscrito
    const existing = await queryOne(
      'SELECT id FROM user_courses WHERE user_id = ? AND course_id = ?',
      [user_id, params.id]
    );

    if (existing) {
      return NextResponse.json(
        { error: 'El estudiante ya está inscrito en este curso' },
        { status: 400 }
      );
    }

    // Inscribir al estudiante
    await query(
      'INSERT INTO user_courses (user_id, course_id, started_at, progress, completed) VALUES (?, ?, NOW(), 0, 0)',
      [user_id, params.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Estudiante inscrito exitosamente'
    });

  } catch (error) {
    console.error('Error enrolling student:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














