import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const userId = decoded.id;
    const userRole = decoded.role;

    // Obtener notificaciones para este usuario
    const notifications = await query(`
      SELECT DISTINCT n.*, 
             CASE WHEN nv.id IS NOT NULL THEN 1 ELSE 0 END as is_viewed,
             CASE WHEN nv.is_dismissed = 1 THEN 1 ELSE 0 END as is_dismissed,
             nv.viewed_at,
             nv.dismissed_at
      FROM notifications n
      LEFT JOIN notification_views nv ON n.id = nv.notification_id AND nv.user_id = ?
      WHERE n.is_active = 1
      AND (
          n.target_type = 'all'
          OR (n.target_type = 'estudiantes' AND ? = 'estudiante')
          OR (n.target_type = 'profesores' AND ? = 'profesor')
          OR (n.target_type = 'superadmins' AND ? = 'superadmin')
          OR (n.target_type = 'combinado' AND JSON_CONTAINS(n.target_roles, ?))
          OR (n.target_type = 'curso_especifico' AND EXISTS (
              SELECT 1 FROM user_courses uc WHERE uc.user_id = ? AND uc.course_id = n.target_course_id
          ))
      )
      AND (nv.id IS NULL OR nv.is_dismissed = 0)
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [
      userId, 
      userRole, 
      userRole, 
      userRole, 
      JSON.stringify(userRole),
      userId
    ]);

    return NextResponse.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














