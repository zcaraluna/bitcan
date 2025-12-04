/**
 * API v2 - Certificado individual
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getCertificateService } from '@/lib/certificates/certificate-service';

/**
 * GET - Obtener certificado por ID
 */
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

    return NextResponse.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error('Error getting certificate:', error);
    return NextResponse.json(
      { error: 'Error al obtener certificado' },
      { status: 500 }
    );
  }
}








