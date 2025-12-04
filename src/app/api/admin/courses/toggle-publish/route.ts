import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
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
    const { course_id, is_published } = body;

    if (!course_id) {
      return NextResponse.json(
        { error: 'ID del curso requerido' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE courses SET is_published = ?, updated_at = NOW() WHERE id = ?',
      [is_published ? 1 : 0, course_id]
    );

    return NextResponse.json({
      success: true,
      message: is_published ? 'Curso publicado' : 'Curso despublicado'
    });

  } catch (error) {
    console.error('Error toggling course publish:', error);
    return NextResponse.json(
      { error: 'Error al cambiar estado de publicación' },
      { status: 500 }
    );
  }
}

