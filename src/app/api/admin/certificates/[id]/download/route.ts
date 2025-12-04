import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
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

    const certificateId = params.id;

    // Obtener certificado de la base de datos
    const certificate = await queryOne(`
      SELECT 
        c.*,
        u.name as student_name,
        u.email as student_email,
        co.title as course_title
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      JOIN courses co ON c.course_id = co.id
      WHERE c.id = ?
    `, [certificateId]);

    if (!certificate) {
      return NextResponse.json({ error: 'Certificado no encontrado' }, { status: 404 });
    }

    const certificateData = JSON.parse(certificate.certificate_data);
    
    // Devolver el HTML del certificado
    return new NextResponse(certificateData.html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="certificado-${certificate.certificate_number}.html"`
      }
    });

  } catch (error) {
    console.error('Error downloading certificate:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
