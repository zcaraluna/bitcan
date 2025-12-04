'use client';

/**
 * Lista moderna de certificados
 */

import { useState, useEffect } from 'react';
import { Certificate, CertificateFilters } from '@/types/certificates';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CertificateListV2Props {
  filters?: CertificateFilters;
  onCertificateClick?: (certificate: Certificate) => void;
}

export default function CertificateListV2({ filters, onCertificateClick }: CertificateListV2Props) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
  }, [filters]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.user_id) params.append('user_id', filters.user_id.toString());
      if (filters?.course_id) params.append('course_id', filters.course_id.toString());
      if (filters?.certificate_type) params.append('certificate_type', filters.certificate_type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.search) params.append('search', filters.search);

      const response = await fetch(`/api/v2/certificates?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCertificates(data.data);
      } else {
        setError(data.error || 'Error al cargar certificados');
      }
    } catch (err) {
      console.error('Error loading certificates:', err);
      setError('Error al cargar certificados');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificateId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
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

  const getStatusBadge = (status: string) => {
    const badges = {
      issued: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      revoked: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800',
    };
    
    const labels = {
      issued: 'Emitido',
      draft: 'Borrador',
      revoked: 'Revocado',
      expired: 'Expirado',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status as keyof typeof badges] || badges.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      course: 'bg-blue-100 text-blue-800',
      module: 'bg-purple-100 text-purple-800',
    };
    
    const labels = {
      course: 'Curso',
      module: 'Módulo',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[type as keyof typeof badges] || badges.course}`}>
        {labels[type as keyof typeof labels] || type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        No se encontraron certificados
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {certificates.map((cert) => (
        <div
          key={cert.id}
          onClick={() => onCertificateClick?.(cert)}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {cert.certificate_data?.course_title || 'Curso'}
              </h3>
              <p className="text-sm text-gray-600">
                {cert.certificate_data?.student_name || 'Estudiante'}
              </p>
            </div>
            <div className="flex gap-2">
              {getTypeBadge(cert.certificate_type)}
              {getStatusBadge(cert.status)}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-500">N° Certificado:</span>
              <p className="font-mono font-medium">{cert.certificate_number}</p>
            </div>
            <div>
              <span className="text-gray-500">Fecha de emisión:</span>
              <p className="font-medium">
                {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('es-PY') : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Duración:</span>
              <p className="font-medium">{cert.certificate_data?.duration_hours || 'N/A'} horas</p>
            </div>
            <div>
              <span className="text-gray-500">Finalización:</span>
              <p className="font-medium">
                {cert.certificate_data?.completion_date ? new Date(cert.certificate_data.completion_date).toLocaleDateString('es-PY') : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={(e) => handleDownload(cert.id, e)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Descargar PDF
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/dashboard_superadmin/v2/certificates/${cert.id}`, '_blank');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Ver Detalles
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

