import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { safeParseJSON } from '@/lib/certificates/certificate-service';

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

    // Obtener TODOS los certificados del usuario directamente de la BD
    const allCerts = await query(`
      SELECT 
        c.*,
        co.title as course_title,
        co.description as course_description
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [userId]);

    // Parsear certificate_data para cada certificado
    const parsedCerts = allCerts.map((cert: any) => {
      const certData = safeParseJSON(cert.certificate_data);
      return {
        id: cert.id,
        certificate_type: cert.certificate_type,
        certificate_number: cert.certificate_number,
        status: cert.status,
        course_title: cert.course_title,
        course_id: cert.course_id,
        created_at: cert.created_at,
        certificate_data: certData,
        module_name: certData?.module_name || null,
        has_module_name: !!certData?.module_name,
        raw_certificate_data: cert.certificate_data // Para debug
      };
    });

    const moduleCerts = parsedCerts.filter(c => c.certificate_type === 'module_completion' || c.certificate_type === 'module');
    const courseCerts = parsedCerts.filter(c => c.certificate_type === 'course_completion' || c.certificate_type === 'course' || !c.certificate_type);

    return NextResponse.json({
      success: true,
      debug: {
        user_id: userId,
        total_certificates: parsedCerts.length,
        module_certificates: moduleCerts.length,
        course_certificates: courseCerts.length,
        all_certificates: parsedCerts,
        module_certs_detail: moduleCerts,
        course_certs_detail: courseCerts
      }
    });

  } catch (error) {
    console.error('Error en debug de certificados:', error);
    return NextResponse.json(
      { error: 'Error al obtener certificados', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}



