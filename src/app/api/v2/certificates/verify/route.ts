/**
 * API v2 - Verificar certificado (público)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCertificateService } from '@/lib/certificates/certificate-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certificate_number = searchParams.get('number');

    if (!certificate_number) {
      return NextResponse.json(
        { error: 'Número de certificado requerido' },
        { status: 400 }
      );
    }

    const service = getCertificateService();
    const verification = await service.verifyCertificate(certificate_number);

    return NextResponse.json({
      success: true,
      data: verification,
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json(
      { error: 'Error al verificar certificado' },
      { status: 500 }
    );
  }
}








