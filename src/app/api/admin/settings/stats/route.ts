import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener estadísticas del sistema
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener estadísticas
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalLessons,
      totalCertificates
    ] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM users') as Promise<{ count: number }>,
      queryOne('SELECT COUNT(*) as count FROM courses') as Promise<{ count: number }>,
      queryOne('SELECT COUNT(*) as count FROM user_courses') as Promise<{ count: number }>,
      queryOne('SELECT COUNT(*) as count FROM lessons') as Promise<{ count: number }>,
      queryOne('SELECT COUNT(*) as count FROM certificates') as Promise<{ count: number }>
    ]);

    const stats = {
      total_users: totalUsers?.count || 0,
      total_courses: totalCourses?.count || 0,
      total_enrollments: totalEnrollments?.count || 0,
      total_lessons: totalLessons?.count || 0,
      total_certificates: totalCertificates?.count || 0
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching system stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














