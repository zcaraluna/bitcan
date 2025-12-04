/**
 * API v2 - Descargar certificado como PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCertificateService } from '@/lib/certificates/certificate-service';

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
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const certificateId = parseInt(params.id);
    const service = getCertificateService();
    
    // Obtener certificado
    const certificate = await service.getCertificate(certificateId);
    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (decoded.role === 'estudiante' && certificate.user_id !== decoded.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Verificar si el certificado requiere calificación y si ya fue recibido
    if (decoded.role === 'estudiante') {
      const { queryOne } = await import('@/lib/db');
      const certData = await queryOne(
        `SELECT certificate_type, is_received, certificate_data FROM certificates WHERE id = ?`,
        [certificateId]
      );

      if (!certData) {
        return NextResponse.json({ error: 'Certificado no encontrado' }, { status: 404 });
      }

      // Certificados de curso completo siempre requieren calificación
      if (certData.certificate_type === 'course' || certData.certificate_type === null) {
        if (!certData.is_received || certData.is_received === 0) {
          return NextResponse.json(
            { error: 'Debes calificar el curso antes de descargar el certificado' },
            { status: 403 }
          );
        }
      }
      // Certificados de módulo: verificar si requiere calificación
      else if (certData.certificate_type === 'module') {
        const certDataParsed = certData.certificate_data ? JSON.parse(certData.certificate_data) : {};
        if (certDataParsed.requires_rating === true) {
          if (!certData.is_received || certData.is_received === 0) {
            return NextResponse.json(
              { error: 'Debes calificar antes de descargar el certificado' },
              { status: 403 }
            );
          }
        }
      }
    }

    // Generar PDF
    const pdfBuffer = await service.generatePDF(certificateId);

    // Nombre del archivo
    const studentName = (certificate.certificate_data?.student_name || 'Estudiante')
      .replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Certificado_${studentName}_${certificate.certificate_number}.pdf`;

    // Devolver PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error downloading certificate:', error);
    return NextResponse.json(
      { 
        error: 'Error al descargar certificado',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

