'use client';

/**
 * Página de detalles de certificado individual
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Certificate } from '@/types/certificates';

export default function CertificateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const certificateId = parseInt(params.id as string);
  
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificate();
  }, [certificateId]);

  const loadCertificate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/certificates/${certificateId}`);
      const data = await response.json();
      
      if (data.success) {
        setCertificate(data.data);
      } else {
        alert('Error al cargar certificado');
        router.push('/dashboard_superadmin/v2/certificates');
      }
    } catch (error) {
      console.error('Error loading certificate:', error);
      alert('Error al cargar certificado');
      router.push('/dashboard_superadmin/v2/certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/v2/certificates/${certificateId}/download`);
      
      if (!response.ok) {
        throw new Error('Error al descargar certificado');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado_${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading certificate:', err);
      alert('Error al descargar certificado');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!certificate) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Certificado no encontrado</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push('/dashboard_superadmin/v2/certificates')}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-flex items-center gap-2"
          >
            ← Volver
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Detalles del Certificado
          </h1>
          <p className="text-gray-600">
            Certificado N° {certificate.certificate_number}
          </p>
        </div>

        {/* Información del certificado */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Estudiante</h3>
              <p className="text-lg font-semibold text-gray-900">{certificate.certificate_data?.student_name || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Curso</h3>
              <p className="text-lg font-semibold text-gray-900">{certificate.certificate_data?.course_title || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Número de Certificado</h3>
              <p className="text-lg font-mono font-semibold text-gray-900">{certificate.certificate_number}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Estado</h3>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                certificate.status === 'issued' ? 'bg-green-100 text-green-800' :
                certificate.status === 'revoked' ? 'bg-red-100 text-red-800' :
                certificate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {certificate.status === 'issued' ? 'Emitido' :
                 certificate.status === 'revoked' ? 'Revocado' :
                 certificate.status === 'pending' ? 'Pendiente' :
                 certificate.status}
              </span>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Fecha de Emisión</h3>
              <p className="text-lg font-semibold text-gray-900">
                {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString('es-PY') : 'N/A'}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Fecha de Finalización</h3>
              <p className="text-lg font-semibold text-gray-900">
                {certificate.certificate_data?.completion_date ? 
                  new Date(certificate.certificate_data.completion_date).toLocaleDateString('es-PY') : 
                  'N/A'}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Duración</h3>
              <p className="text-lg font-semibold text-gray-900">{certificate.certificate_data?.duration_hours || 0} horas</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Tipo</h3>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                certificate.certificate_type === 'course_completion' ? 'bg-blue-100 text-blue-800' :
                certificate.certificate_type === 'module_completion' ? 'bg-purple-100 text-purple-800' :
                'bg-indigo-100 text-indigo-800'
              }`}>
                {certificate.certificate_type === 'course_completion' ? 'Curso Completo' :
                 certificate.certificate_type === 'module_completion' ? 'Módulo' :
                 certificate.certificate_type}
              </span>
            </div>
          </div>

          {certificate.certificate_data?.instructor_names && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Instructores</h3>
              <p className="text-lg font-semibold text-gray-900">
                {certificate.certificate_data?.instructor_names}
              </p>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Descargar PDF
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}






