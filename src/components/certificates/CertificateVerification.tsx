'use client';

/**
 * Componente de verificación de certificados
 */

import { useState, useEffect } from 'react';
import { CertificateVerification } from '@/types/certificates';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CertificateVerificationComponentProps {
  initialNumber?: string | null;
}

export default function CertificateVerificationComponent({ 
  initialNumber 
}: CertificateVerificationComponentProps = {}) {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(false);

  // Prellenar el campo si se proporciona un número inicial
  useEffect(() => {
    if (initialNumber) {
      setCertificateNumber(initialNumber);
    }
  }, [initialNumber]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!certificateNumber.trim()) {
      alert('Ingresa un número de certificado');
      return;
    }

    try {
      setLoading(true);
      setVerification(null);

      const response = await fetch(`/api/v2/certificates/verify?number=${encodeURIComponent(certificateNumber)}`);
      const data = await response.json();

      if (data.success) {
        setVerification(data.data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error verifying certificate:', error);
      alert('Error al verificar certificado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verificar Certificado
        </h2>
        <p className="text-gray-600 mb-6">
          Ingresa el número de certificado para verificar su autenticidad
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Certificado
            </label>
            <input
              type="text"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value.toUpperCase())}
              placeholder="BIT2025XXXXXXXX"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner />
                Verificando...
              </>
            ) : (
              'Verificar Certificado'
            )}
          </button>
        </form>

        {verification && (
          <div className={`mt-6 p-6 rounded-lg border-2 ${
            verification.valid 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-start gap-3 mb-4">
              <div className={`text-3xl ${verification.valid ? 'text-green-600' : 'text-red-600'}`}>
                {verification.valid ? '✓' : '✗'}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-1 ${
                  verification.valid ? 'text-green-900' : 'text-red-900'
                }`}>
                  {verification.valid ? 'Certificado Válido' : 'Certificado Inválido'}
                </h3>
                <p className={verification.valid ? 'text-green-700' : 'text-red-700'}>
                  {verification.message}
                </p>
              </div>
            </div>

            {verification.valid && verification.certificate && (
              <div className="mt-4 pt-4 border-t border-green-200 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-green-700 font-medium">Estudiante:</span>
                    <p className="text-green-900">{verification.student_name}</p>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Curso:</span>
                    <p className="text-green-900">{verification.course_title}</p>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Fecha de emisión:</span>
                    <p className="text-green-900">
                      {verification.issue_date ? new Date(verification.issue_date).toLocaleDateString('es-PY') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Estado:</span>
                    <p className="text-green-900 capitalize">Válido</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}








