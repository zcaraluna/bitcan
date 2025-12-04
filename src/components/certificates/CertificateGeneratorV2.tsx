'use client';

/**
 * Generador moderno de certificados
 */

import { useState, useEffect } from 'react';
import { GenerateCertificateConfig } from '@/types/certificates';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CertificateGeneratorV2Props {
  courseId: number;
  courseTitle: string;
  onComplete?: () => void;
}

interface Student {
  id: number;
  name: string;
  email: string;
  enrollment_date?: string;
  started_at?: string;
  progress_percentage?: number;
}

export default function CertificateGeneratorV2({ courseId, courseTitle, onComplete }: CertificateGeneratorV2Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [config, setConfig] = useState<Partial<GenerateCertificateConfig>>({
    certificate_type: 'course_completion',
    requires_rating: false
  });

  useEffect(() => {
    loadEligibleStudents();
  }, [courseId, config.certificate_type]);

  const loadEligibleStudents = async () => {
    try {
      setLoading(true);
      // Para módulos, obtener todos los estudiantes del curso
      // Para curso completo, obtener solo los que completaron
      const endpoint = config.certificate_type === 'module_completion'
        ? `/api/admin/certificates?action=course_students&course_id=${courseId}`
        : `/api/v2/certificates/eligible?course_id=${courseId}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        // Normalizar la respuesta según el endpoint
        const studentsData = data.data || data.students || [];
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (selectedStudents.length === 0) {
      alert('Selecciona al menos un estudiante');
      return;
    }

    try {
      setGenerating(true);

      const response = await fetch('/api/v2/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          student_ids: selectedStudents,
          certificate_type: config.certificate_type || 'course_completion',
          module_name: config.module_name,
          manual_hours: config.manual_hours,
          manual_start_date: config.manual_start_date,
          manual_completion_date: config.manual_completion_date,
          custom_signature: config.custom_signature,
          custom_message: config.custom_message,
          requires_rating: config.certificate_type === 'module_completion' ? (config.requires_rating || false) : undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        const successful = data.data.filter((r: any) => r.success).length;
        const failed = data.data.filter((r: any) => !r.success).length;
        alert(`✓ ${data.message}\n\nGenerados: ${successful}\nErrores: ${failed}`);
        setSelectedStudents([]);
        loadEligibleStudents();
        onComplete?.();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating certificates:', error);
      alert('Error al generar certificados');
    } finally {
      setGenerating(false);
    }
  };

  const toggleStudent = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAll = () => {
    setSelectedStudents(prev =>
      prev.length === students.length ? [] : students.map(s => s.id)
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuración */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Certificado
            </label>
            <select
              value={config.certificate_type}
              onChange={(e) => setConfig({ ...config, certificate_type: e.target.value as 'course_completion' | 'module_completion' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="course_completion">Curso Completo</option>
              <option value="module_completion">Módulo</option>
            </select>
          </div>

          {config.certificate_type === 'module_completion' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Módulo
                </label>
                <input
                  type="text"
                  value={config.module_name || ''}
                  onChange={(e) => setConfig({ ...config, module_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Módulo 1 - Introducción"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.requires_rating || false}
                    onChange={(e) => setConfig({ ...config, requires_rating: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Requiere calificación antes de descargar</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio (opcional)
                </label>
                <input
                  type="date"
                  value={config.manual_start_date || ''}
                  onChange={(e) => setConfig({ ...config, manual_start_date: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si se deja vacío, se usará la fecha de inscripción del estudiante
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Finalización (opcional)
                </label>
                <input
                  type="date"
                  value={config.manual_completion_date || ''}
                  onChange={(e) => setConfig({ ...config, manual_completion_date: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si se deja vacío, se usará la fecha de finalización del curso o la fecha actual
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horas (opcional)
            </label>
            <input
              type="number"
              value={config.manual_hours || ''}
              onChange={(e) => setConfig({ ...config, manual_hours: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Dejar vacío para usar la del curso"
            />
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Firma Personalizada (opcional)
            </label>
            <textarea
              value={config.custom_signature || ''}
              onChange={(e) => setConfig({ ...config, custom_signature: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Ej: El mencionado curso ha sido dictado por\nBITCAN"
            />
            <p className="text-xs text-gray-500 mt-1">
              Texto que aparecerá en la firma del certificado. Si se deja vacío, se usará el instructor del curso.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje Personalizado (opcional)
            </label>
            <textarea
              value={config.custom_message || ''}
              onChange={(e) => setConfig({ ...config, custom_message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Mensaje que aparecerá abajo a la izquierda del certificado"
            />
            <p className="text-xs text-gray-500 mt-1">
              Este mensaje aparecerá en la parte inferior izquierda del certificado, debajo de la firma
            </p>
          </div>
        </div>
      </div>

      {/* Lista de estudiantes */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Estudiantes Elegibles ({students.length})
          </h3>
          <button
            onClick={toggleAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {selectedStudents.length === students.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>
        </div>

        {students.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay estudiantes elegibles para certificados
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.map((student) => (
              <label
                key={student.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => toggleStudent(student.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-500">{student.email}</p>
                </div>
                <div className="text-right text-sm">
                  {student.progress_percentage !== undefined && (
                    <p className="text-gray-600">Progreso: {student.progress_percentage}%</p>
                  )}
                  <p className="text-gray-500">
                    Inscrito: {new Date(student.enrollment_date || student.started_at || Date.now()).toLocaleDateString('es-PY')}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Botón de generación */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleGenerate}
          disabled={selectedStudents.length === 0 || generating}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
        >
          {generating ? (
            <>
              <LoadingSpinner />
              Generando...
            </>
          ) : (
            <>
              Generar Certificados ({selectedStudents.length})
            </>
          )}
        </button>
      </div>
    </div>
  );
}

