import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener datos mensuales
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
    const months = parseInt(searchParams.get('months') || '6');

    // Obtener datos mensuales de inscripciones y completados
    const monthlyData = await query(`
      SELECT 
        DATE_FORMAT(uc.started_at, '%Y-%m') as mes,
        COUNT(DISTINCT uc.id) as inscripciones,
        COUNT(DISTINCT CASE WHEN uc.completed = 1 THEN uc.id END) as completados
      FROM user_courses uc
      WHERE uc.started_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY DATE_FORMAT(uc.started_at, '%Y-%m')
      ORDER BY mes DESC
    `, [months.toString()]);

    // Formatear nombres de meses
    const mesesNombres = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const formattedData = monthlyData.map((item: any) => {
      const [year, month] = item.mes.split('-');
      const monthIndex = parseInt(month) - 1;
      return {
        mes: `${mesesNombres[monthIndex]} ${year}`,
        inscripciones: item.inscripciones,
        completados: item.completados
      };
    });

    return NextResponse.json({
      success: true,
      monthlyData: formattedData
    });

  } catch (error) {
    console.error('Error fetching monthly data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}














