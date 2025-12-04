import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Exportar datos a CSV
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
    const format = searchParams.get('format') || 'csv';

    if (format !== 'csv') {
      return NextResponse.json(
        { error: 'Formato no soportado' },
        { status: 400 }
      );
    }

    // Obtener datos para exportar
    const users = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        COUNT(DISTINCT uc.course_id) as cursos_inscritos,
        COUNT(DISTINCT CASE WHEN uc.completed = 1 THEN uc.course_id END) as cursos_completados
      FROM users u
      LEFT JOIN user_courses uc ON u.id = uc.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    // Crear CSV
    let csv = 'ID,Nombre,Email,Rol,Fecha Registro,Cursos Inscritos,Cursos Completados\n';
    
    users.forEach((user: any) => {
      const fecha = new Date(user.created_at).toLocaleDateString('es-PY');
      csv += `${user.id},"${user.name}","${user.email}","${user.role}","${fecha}",${user.cursos_inscritos},${user.cursos_completados}\n`;
    });

    // Retornar CSV
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="reporte_bitcan_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














