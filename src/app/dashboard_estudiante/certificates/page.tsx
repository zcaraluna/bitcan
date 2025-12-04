'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { Award, Download, Eye, Calendar, CheckCircle, Star, Copy, Shield } from 'lucide-react';

interface Certificate {
  id: number;
  course_title: string;
  course_id: number;
  certificate_type: string;
  certificate_number: string;
  status: string;
  issue_date?: string;
  created_at: string;
  is_received?: number;
  professor_rating?: number;
  platform_rating?: number;
  course_rating?: number;
  professor_feedback?: string;
  platform_feedback?: string;
  course_feedback?: string;
  certificate_data?: any;
}

interface CompletedCourse {
  course_id: number;
  course_title: string;
  course_description?: string;
  completed_at?: string;
}

export default function MisCertificados() {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [completedCoursesWithoutCert, setCompletedCoursesWithoutCert] = useState<CompletedCourse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState<number | null>(null);
  const [ratingData, setRatingData] = useState<{
    course_id: number;
    professor_rating: number;
    professor_feedback: string;
    platform_rating: number;
    platform_feedback: string;
    course_rating: number;
    course_feedback: string;
  } | null>(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/certificates');
      if (response.ok) {
        const data = await response.json();
        setCertificates(data.data || []);
        setCompletedCoursesWithoutCert(data.completed_courses_without_cert || []);
      } else {
        setError('Error al cargar los certificados');
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError('Error al cargar los certificados');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificateId: number) => {
    try {
      const response = await fetch(`/api/v2/certificates/${certificateId}/download`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificado-${certificateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error('Error', 'Error al descargar el certificado');
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Error', 'Error al descargar el certificado');
    }
  };

  const handleView = (certificateId: number) => {
    window.open(`/api/v2/certificates/${certificateId}/download`, '_blank');
  };

  const handleCopyVerifyLink = (certificateNumber: string) => {
    const verifyUrl = `${window.location.origin}/verificar_certificado?numero=${encodeURIComponent(certificateNumber)}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(verifyUrl).then(() => {
        toast.success('Enlace copiado', 'El enlace de verificación ha sido copiado al portapapeles');
      }).catch((err) => {
        toast.error('Error', 'Error al copiar el enlace');
      });
    } else {
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = verifyUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        toast.success('Enlace copiado', 'El enlace de verificación ha sido copiado al portapapeles');
      } catch (err) {
        toast.error('Error', 'Error al copiar el enlace');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const handleOpenRatingModal = (certificate: Certificate) => {
    setRatingData({
      course_id: certificate.course_id,
      professor_rating: 0,
      professor_feedback: '',
      platform_rating: 0,
      platform_feedback: '',
      course_rating: 0,
      course_feedback: '',
    });
    setRatingModalOpen(certificate.id);
  };

  const handleStarClick = (type: 'professor' | 'platform' | 'course', value: number) => {
    if (!ratingData) return;
    setRatingData({
      ...ratingData,
      [`${type}_rating`]: value,
    });
  };

  const handleRatingSubmit = async () => {
    if (!ratingData) return;

    if (
      ratingData.professor_rating < 1 || ratingData.professor_rating > 5 ||
      ratingData.platform_rating < 1 || ratingData.platform_rating > 5 ||
      ratingData.course_rating < 1 || ratingData.course_rating > 5 ||
      !ratingData.professor_feedback.trim() ||
      !ratingData.platform_feedback.trim() ||
      !ratingData.course_feedback.trim()
    ) {
      toast.error('Error', 'Las calificaciones deben estar entre 1 y 5 estrellas y todos los comentarios son obligatorios.');
      return;
    }

    try {
      const response = await fetch('/api/student/certificates/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingData),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success('Calificación enviada', result.message);
        setRatingModalOpen(null);
        setRatingData(null);
        fetchCertificates(); // Recargar certificados
      } else {
        toast.error('Error', result.error || 'Error al enviar la calificación');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Error', 'Error al enviar la calificación');
    }
  };

  const renderStars = (type: 'professor' | 'platform' | 'course', currentRating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleStarClick(type, value)}
            className={`text-2xl transition-colors ${
              value <= currentRating
                ? 'text-yellow-400'
                : 'text-gray-300 hover:text-yellow-300'
            }`}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              Reintentar
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg p-8">
            <h1 className="text-4xl font-bold mb-2">Mis Certificados</h1>
            <p className="text-purple-50 text-lg">Galería de tus logros académicos</p>
          </div>

          {/* Información de Verificación Pública */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h6 className="font-semibold text-blue-900 mb-1">¿Necesitan verificar tu certificado?</h6>
                <p className="text-blue-800 text-sm">
                  Cualquier persona puede verificar la autenticidad de tus certificados en:{' '}
                  <strong>
                    <a href="/verificar_certificado" target="_blank" className="text-blue-600 hover:underline">
                      bitcan.com.py/verificar_certificado
                    </a>
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{certificates.length}</div>
              <div className="text-sm text-gray-600">Certificados Obtenidos</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {certificates.filter(c => c.status === 'issued').length}
              </div>
              <div className="text-sm text-gray-600">Emitidos</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {certificates.filter(c => {
                  const issuedDate = new Date((c as any).issue_date || c.created_at);
                  const now = new Date();
                  const diffTime = Math.abs(now.getTime() - issuedDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays <= 30;
                }).length}
              </div>
              <div className="text-sm text-gray-600">Este Mes</div>
            </div>
          </div>

          {/* Certificados Disponibles */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Certificados Disponibles</h3>
            
            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((certificate) => (
                  <div key={certificate.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="text-center mb-4">
                      {certificate.certificate_type === 'module' ? (
                        <>
                          <Award className="w-12 h-12 text-green-600 mx-auto mb-3" />
                          <h5 className="font-semibold text-gray-900">{certificate.course_title}</h5>
                          <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Certificado de Módulo
                          </span>
                          {certificate.certificate_data?.module_name && (
                            <p className="text-sm text-blue-600 mt-2">
                              {certificate.certificate_data.module_name}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <Award className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                          <h5 className="font-semibold text-gray-900">{certificate.course_title}</h5>
                          <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                            Certificado de Finalización
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="mb-4 text-sm text-gray-500">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Generado el {new Date(certificate.created_at || (certificate as any).issue_date).toLocaleDateString('es-ES')}
                    </div>
                    
                    {certificate.certificate_type === 'module' ? (
                      // Certificado de módulo - Verificar si requiere calificación
                      (() => {
                        const requiresRating = certificate.certificate_data?.requires_rating === true;
                        const isReceived = certificate.is_received === 1;
                        
                        if (requiresRating && !isReceived) {
                          // Módulo que requiere calificación y aún no calificado
                          return (
                            <div className="space-y-3">
                              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                Pendiente de Calificación
                              </span>
                              <p className="text-xs text-gray-500">
                                Califica el curso para recibir tu certificado de módulo
                              </p>
                              <button
                                onClick={() => handleOpenRatingModal(certificate)}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                <Star className="w-4 h-4 inline mr-2" />
                                Calificar Curso
                              </button>
                            </div>
                          );
                        } else if (requiresRating && isReceived) {
                          // Módulo que requiere calificación y ya calificado
                          return (
                            <div className="space-y-3">
                              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                <CheckCircle className="w-3 h-3 inline mr-1" />
                                Recibido
                              </span>
                              {certificate.professor_rating && (
                                <div className="text-xs text-gray-600 space-y-1">
                                  <div>Profesor: {'★'.repeat(certificate.professor_rating)}{'☆'.repeat(5 - certificate.professor_rating)}</div>
                                  <div>Plataforma: {'★'.repeat(certificate.platform_rating || 0)}{'☆'.repeat(5 - (certificate.platform_rating || 0))}</div>
                                  <div>Curso: {'★'.repeat(certificate.course_rating || 0)}{'☆'.repeat(5 - (certificate.course_rating || 0))}</div>
                                </div>
                              )}
                              <button
                                onClick={() => handleDownload(certificate.id)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                <Download className="w-4 h-4 inline mr-2" />
                                Descargar PDF
                              </button>
                              <button
                                onClick={() => handleCopyVerifyLink(certificate.certificate_number)}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                <Copy className="w-4 h-4 inline mr-2" />
                                Copiar Enlace de Verificación
                              </button>
                            </div>
                          );
                        } else {
                          // Módulo que no requiere calificación
                          return (
                            <div className="space-y-3">
                              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                <CheckCircle className="w-3 h-3 inline mr-1" />
                                Disponible
                              </span>
                              <p className="text-xs text-gray-500">
                                Los certificados de módulo no requieren calificación
                              </p>
                              <button
                                onClick={() => handleDownload(certificate.id)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                <Download className="w-4 h-4 inline mr-2" />
                                Descargar PDF
                              </button>
                              <button
                                onClick={() => handleCopyVerifyLink(certificate.certificate_number)}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                <Copy className="w-4 h-4 inline mr-2" />
                                Copiar Enlace de Verificación
                              </button>
                            </div>
                          );
                        }
                      })()
                    ) : certificate.is_received ? (
                      // Certificado de curso completo recibido
                      <div className="space-y-3">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Recibido
                        </span>
                        
                        {certificate.professor_rating && (
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Profesor: {'★'.repeat(certificate.professor_rating)}{'☆'.repeat(5 - certificate.professor_rating)}</div>
                            <div>Plataforma: {'★'.repeat(certificate.platform_rating || 0)}{'☆'.repeat(5 - (certificate.platform_rating || 0))}</div>
                            <div>Curso: {'★'.repeat(certificate.course_rating || 0)}{'☆'.repeat(5 - (certificate.course_rating || 0))}</div>
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleDownload(certificate.id)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Download className="w-4 h-4 inline mr-2" />
                          Descargar PDF
                        </button>
                        <button
                          onClick={() => handleCopyVerifyLink(certificate.certificate_number)}
                          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Copy className="w-4 h-4 inline mr-2" />
                          Copiar Enlace de Verificación
                        </button>
                      </div>
                    ) : (
                      // Certificado de curso completo pendiente de calificación
                      <div className="space-y-3">
                        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          Pendiente de Calificación
                        </span>
                        <p className="text-xs text-gray-500">
                          Califica el curso para recibir tu certificado
                        </p>
                        <button
                          onClick={() => handleOpenRatingModal(certificate)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Star className="w-4 h-4 inline mr-2" />
                          Calificar Curso
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No tienes certificados aún</h4>
                <p className="text-gray-600 mb-4">Completa cursos y califícalos para obtener tus certificados.</p>
              </div>
            )}
          </div>

          {/* Cursos Completados sin Certificado */}
          {completedCoursesWithoutCert.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Cursos Completados Pendientes de Certificado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedCoursesWithoutCert.map((course) => (
                  <div key={course.course_id} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="text-center mb-4">
                      <Award className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                      <h5 className="font-semibold text-gray-900">{course.course_title}</h5>
                      <p className="text-sm text-gray-500 mt-1">Curso completado</p>
                    </div>
                    <div className="text-sm text-gray-500 mb-3">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {course.completed_at
                        ? `Completado el ${new Date(course.completed_at).toLocaleDateString('es-ES')}`
                        : 'Curso disponible'}
                    </div>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-3">
                      Certificado en proceso
                    </span>
                    <p className="text-xs text-gray-500">
                      El certificado estará disponible pronto. Recibirás una notificación cuando esté listo.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal de Calificación */}
          {ratingModalOpen && ratingData && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">
                      <Star className="w-5 h-5 inline mr-2 text-yellow-400" />
                      Calificar Curso
                    </h3>
                    <button
                      onClick={() => {
                        setRatingModalOpen(null);
                        setRatingData(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Calificación del Profesor */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h6 className="font-semibold text-gray-900 mb-3">Calificación del Profesor</h6>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Puntuación:</label>
                      {renderStars('professor', ratingData.professor_rating)}
                      <p className="text-xs text-gray-500 mt-1">Haz clic en las estrellas para calificar</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Comentarios:</label>
                      <textarea
                        value={ratingData.professor_feedback}
                        onChange={(e) => setRatingData({ ...ratingData, professor_feedback: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="Comparte tu experiencia con el profesor..."
                      />
                    </div>
                  </div>

                  {/* Calificación de la Plataforma */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h6 className="font-semibold text-gray-900 mb-3">Calificación de la Plataforma</h6>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Puntuación:</label>
                      {renderStars('platform', ratingData.platform_rating)}
                      <p className="text-xs text-gray-500 mt-1">Haz clic en las estrellas para calificar</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Comentarios:</label>
                      <textarea
                        value={ratingData.platform_feedback}
                        onChange={(e) => setRatingData({ ...ratingData, platform_feedback: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="Comparte tu experiencia con la plataforma..."
                      />
                    </div>
                  </div>

                  {/* Calificación del Curso */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h6 className="font-semibold text-gray-900 mb-3">Calificación del Curso</h6>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Puntuación:</label>
                      {renderStars('course', ratingData.course_rating)}
                      <p className="text-xs text-gray-500 mt-1">Haz clic en las estrellas para calificar</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Comentarios:</label>
                      <textarea
                        value={ratingData.course_feedback}
                        onChange={(e) => setRatingData({ ...ratingData, course_feedback: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="Comparte tu experiencia con el curso..."
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setRatingModalOpen(null);
                      setRatingData(null);
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRatingSubmit}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Star className="w-4 h-4 inline mr-2" />
                    Enviar Calificación
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
