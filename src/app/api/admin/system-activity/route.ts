import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Obtener actividad del sistema (inscripciones recientes)
    const activityQuery = `
      SELECT 
        u.name as usuario,
        c.title as curso,
        uc.started_at as fecha
      FROM user_courses uc
      JOIN users u ON uc.user_id = u.id
      JOIN courses c ON uc.course_id = c.id
      ORDER BY uc.started_at DESC
      LIMIT 10
    `;

    const activity = await query(activityQuery);

    return NextResponse.json({
      success: true,
      activity: activity
    });

  } catch (error) {
    console.error('Error fetching system activity:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





