/**
 * API v2 - Certificados
 * Sistema moderno de gestión de certificados
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCertificateService } from '@/lib/certificates/certificate-service';
import { CertificateFilters } from '@/types/certificates';

/**
 * GET - Listar certificados
 */
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

    const { searchParams } = new URL(request.url);
    
    // Construir filtros
    const filters: CertificateFilters = {
      user_id: searchParams.get('user_id') ? parseInt(searchParams.get('user_id')!) : undefined,
      course_id: searchParams.get('course_id') ? parseInt(searchParams.get('course_id')!) : undefined,
      certificate_type: searchParams.get('certificate_type') as any,
      status: searchParams.get('status') as any,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Aplicar permisos según rol
    if (decoded.role === 'estudiante') {
      filters.user_id = decoded.id; // Solo sus certificados
    }

    const service = getCertificateService();
    const certificates = await service.listCertificates(filters);

    // Si es estudiante, también obtener cursos completados sin certificado
    let completedCoursesWithoutCert: any[] = [];
    if (decoded.role === 'estudiante') {
      const { query } = await import('@/lib/db');
      completedCoursesWithoutCert = await query(`
        SELECT 
          uc.*,
          co.title as course_title,
          co.description as course_description
        FROM user_courses uc
        JOIN courses co ON uc.course_id = co.id
        LEFT JOIN certificates c ON uc.course_id = c.course_id 
          AND uc.user_id = c.user_id 
          AND (c.certificate_type = 'course_completion' OR c.certificate_type = 'course' OR c.certificate_type IS NULL)
        WHERE uc.user_id = ? 
          AND uc.completed = 1 
          AND c.id IS NULL
      `, [decoded.id]);
    }

    return NextResponse.json({
      success: true,
      data: certificates,
      completed_courses_without_cert: completedCoursesWithoutCert,
    });
  } catch (error) {
    console.error('Error listing certificates:', error);
    return NextResponse.json(
      { error: 'Error al listar certificados' },
      { status: 500 }
    );
  }
}

/**
 * POST - Generar certificados
 */
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
    const { config } = body;

    if (!config || !config.course_id || !config.student_ids || config.student_ids.length === 0) {
      return NextResponse.json(
        { error: 'Configuración inválida' },
        { status: 400 }
      );
    }

    const service = getCertificateService();
    const result = await service.generateCertificates(config, decoded.id);

    return NextResponse.json({
      success: true,
      message: `Se generaron ${result.generated_count} certificados exitosamente`,
      data: result,
    });
  } catch (error) {
    console.error('Error generating certificates:', error);
    return NextResponse.json(
      { 
        error: 'Error al generar certificados',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar (revocar) certificado
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('id');
    const reason = searchParams.get('reason') || 'Sin razón especificada';

    if (!certificateId) {
      return NextResponse.json(
        { error: 'ID de certificado requerido' },
        { status: 400 }
      );
    }

    const service = getCertificateService();
    await service.revokeCertificate(parseInt(certificateId), decoded.id, reason);

    return NextResponse.json({
      success: true,
      message: 'Certificado revocado exitosamente',
    });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    return NextResponse.json(
      { error: 'Error al revocar certificado' },
      { status: 500 }
    );
  }
}








