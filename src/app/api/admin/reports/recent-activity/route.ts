import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener actividad reciente
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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Obtener actividad reciente (inscripciones)
    const inscripciones = await query(`
      SELECT 
        uc.id,
        'inscripcion' as tipo,
        u.name as usuario,
        c.title as curso,
        uc.started_at as fecha,
        '' as details
      FROM user_courses uc
      JOIN users u ON uc.user_id = u.id
      JOIN courses c ON uc.course_id = c.id
      WHERE uc.started_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY uc.started_at DESC
      LIMIT ?
    `, [days.toString(), limit.toString()]);

    // Obtener cursos completados
    const completados = await query(`
      SELECT 
        uc.id,
        'completado' as tipo,
        u.name as usuario,
        c.title as curso,
        uc.completed_at as fecha,
        'Curso completado' as details
      FROM user_courses uc
      JOIN users u ON uc.user_id = u.id
      JOIN courses c ON uc.course_id = c.id
      WHERE uc.completed = 1 
        AND uc.completed_at IS NOT NULL
        AND uc.completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY uc.completed_at DESC
      LIMIT ?
    `, [days.toString(), (limit / 2).toString()]);

    // Obtener certificados emitidos
    const certificados = await query(`
      SELECT 
        cert.id,
        'certificado' as tipo,
        u.name as usuario,
        c.title as curso,
        cert.issue_date as fecha,
        CONCAT('Certificado ', cert.certificate_type) as details
      FROM certificates cert
      JOIN users u ON cert.user_id = u.id
      JOIN courses c ON cert.course_id = c.id
      WHERE cert.issue_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY cert.issue_date DESC
      LIMIT ?
    `, [days.toString(), (limit / 2).toString()]);

    // Combinar y ordenar todas las actividades
    const allActivity = [...inscripciones, ...completados, ...certificados]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      activity: allActivity
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














