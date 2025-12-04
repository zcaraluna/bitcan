'use client';

/**
 * Página pública de verificación de certificados
 * Accesible en /verificar_certificado
 */

import { Suspense } from 'react';
import CertificateVerificationComponent from '@/components/certificates/CertificateVerification';
import { useSearchParams } from 'next/navigation';

function VerificarCertificadoContent() {
  const searchParams = useSearchParams();
  const numero = searchParams.get('numero');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            BITCAN
          </h1>
          <p className="text-xl text-gray-600">
            Sistema de Verificación de Certificados
          </p>
        </div>

        {/* Componente de verificación */}
        <CertificateVerificationComponent initialNumber={numero} />

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Los certificados emitidos por BITCAN pueden ser verificados en cualquier momento
          </p>
          <p className="mt-2">
            Para más información visita{' '}
            <a href="/" className="text-blue-600 hover:text-blue-700">
              bitcan.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerificarCertificadoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <VerificarCertificadoContent />
    </Suspense>
  );
}

