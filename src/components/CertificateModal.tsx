'use client';

import { useState, useEffect } from 'react';
import { X, Users, GraduationCap, Bookmark, Eye, Download, FileText, CheckCircle, Info, Loader2, Edit } from 'lucide-react';

interface CertificateModalProps {
  courseId: number;
  courseTitle: string;
  onClose: () => void;
}

interface Student {
  id: number;
  name: string;
  email: string;
  completed_at: string;
  completion_date: string;
  has_certificate: number;
}

interface Certificate {
  id: number;
  certificate_number: string;
  issue_date: string;
  status: string;
  student_name: string;
  student_email: string;
}

export default function CertificateModal({ courseId, courseTitle, onClose }: CertificateModalProps) {
  const [activeTab, setActiveTab] = useState<'course' | 'module' | 'view'>('course');
  const [eligibleStudents, setEligibleStudents] = useState<Student[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Formulario para certificados de curso completo
  const [courseForm, setCourseForm] = useState({
    manualHours: '',
    manualStartDate: '',
    manualCompletionDate: '',
    customSignature: ''
  });

  // Formulario para certificados de módulo
  const [moduleForm, setModuleForm] = useState({
    moduleName: '',
    moduleHours: '',
    moduleStartDate: '',
    moduleCompletionDate: '',
    moduleCustomSignature: '',
    requiresRating: false
  });

  // Estados para selección
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedModuleStudents, setSelectedModuleStudents] = useState<number[]>([]);

  useEffect(() => {
    if (activeTab === 'course') {
      loadEligibleStudents();
    } else {
      loadCourseStudents();
    }
  }, [activeTab, courseId]);

  const loadEligibleStudents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading eligible students for course:', courseId);
      const response = await fetch(`/api/admin/certificates?action=eligible_students&course_id=${courseId}`);
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📄 Response data:', data);
      
      if (data.success) {
        setEligibleStudents(data.students);
        console.log('✅ Students loaded:', data.students.length);
      } else {
        console.error('❌ API Error:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading eligible students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/certificates?action=course_students&course_id=${courseId}`);
      const data = await response.json();
      
      if (data.success) {
        setEligibleStudents(data.students);
      }
    } catch (error) {
      console.error('Error loading course students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCertificates = async () => {
    try {
      console.log('🔍 Loading certificates for course:', courseId);
      const response = await fetch(`/api/admin/certificates?action=certificates_list&course_id=${courseId}`);
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📄 Response data:', data);
      
      if (data.success) {
        setCertificates(data.certificates);
        console.log('✅ Certificates loaded:', data.certificates.length);
      } else {
        console.error('❌ API Error:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading certificates:', error);
    }
  };

  const handleStudentSelect = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleModuleStudentSelect = (studentId: number) => {
    setSelectedModuleStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    const availableStudents = eligibleStudents.filter(s => !s.has_certificate);
    setSelectedStudents(availableStudents.map(s => s.id));
  };

  const handleSelectAllModules = () => {
    setSelectedModuleStudents(eligibleStudents.map(s => s.id));
  };

  const generateCertificates = async () => {
    if (selectedStudents.length === 0) {
      alert('Por favor selecciona al menos un estudiante para generar certificados.');
      return;
    }

    // LOGGING DETALLADO EN EL FRONTEND
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 FRONTEND: Generando Certificados de CURSO COMPLETO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Active Tab:', activeTab);
    console.log('Course ID:', courseId);
    console.log('Selected Students:', selectedStudents);

    const requestBody = {
      action: 'generate_certificates',
      course_id: courseId,
      student_ids: selectedStudents,
      manual_hours: courseForm.manualHours || null,
      manual_start_date: courseForm.manualStartDate || null,
      manual_completion_date: courseForm.manualCompletionDate || null,
      custom_signature: courseForm.customSignature || null
    };

    console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('✅ Acción enviada:', requestBody.action);
    console.log('═══════════════════════════════════════════════════════════');

    try {
      setGenerating(true);
      const response = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        setSelectedStudents([]);
        loadEligibleStudents();
        loadCertificates();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error generating certificates:', error);
      alert('Error al generar certificados');
    } finally {
      setGenerating(false);
    }
  };

  const generateModuleCertificates = async () => {
    if (!moduleForm.moduleName) {
      alert('Por favor ingresa el nombre del módulo.');
      return;
    }

    if (selectedModuleStudents.length === 0) {
      alert('Por favor selecciona al menos un estudiante para generar certificados de módulo.');
      return;
    }

    // LOGGING DETALLADO EN EL FRONTEND
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 FRONTEND: Generando Certificados de MÓDULO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Active Tab:', activeTab);
    console.log('Course ID:', courseId);
    console.log('Module Name:', moduleForm.moduleName);
    console.log('Selected Students:', selectedModuleStudents);
    console.log('Module Form:', moduleForm);

    const requestBody = {
      action: 'generate_module_certificates',
      course_id: courseId,
      student_ids: selectedModuleStudents,
      module_name: moduleForm.moduleName,
      module_hours: moduleForm.moduleHours || null,
      module_start_date: moduleForm.moduleStartDate || null,
      module_completion_date: moduleForm.moduleCompletionDate || null,
      module_custom_signature: moduleForm.moduleCustomSignature || null,
      requires_rating: moduleForm.requiresRating // Enviar el valor booleano directamente
    };
    
    console.log('🔍 DEBUG - requires_rating en requestBody:', requestBody.requires_rating, '(tipo:', typeof requestBody.requires_rating, ')');

    console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('✅ Acción enviada:', requestBody.action);
    console.log('═══════════════════════════════════════════════════════════');

    try {
      setGenerating(true);
      const response = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      console.log('📥 Response recibida:', data);
      console.log('✅ Success:', data.success);
      console.log('📊 Generated count:', data.generated_count);
      console.log('⏭️  Skipped count:', data.skipped_count);
      console.log('❌ Errors:', data.errors);
      
      if (data.success) {
        console.log('✅ Certificados generados exitosamente');
        alert(data.message);
        setSelectedModuleStudents([]);
        setModuleForm({
          moduleName: '',
          moduleHours: '',
          moduleStartDate: '',
          moduleCompletionDate: '',
          moduleCustomSignature: '',
          requiresRating: false
        });
        loadCourseStudents();
        loadCertificates();
      } else {
        console.error('❌ Error en la respuesta:', data.error);
        alert('Error: ' + (data.message || data.error));
      }
    } catch (error) {
      console.error('Error generating module certificates:', error);
      alert('Error al generar certificados de módulo');
    } finally {
      setGenerating(false);
    }
  };

  const downloadCertificate = (certificateId: number) => {
    window.open(`/api/admin/certificates/${certificateId}/download-pdf`, '_blank');
  };

  const viewCertificate = (certificateId: number) => {
    window.open(`/certificates/${certificateId}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              Gestionar Certificados - {courseTitle}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('course')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'course'
                  ? 'border-gray-700 text-gray-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Curso Completo
            </button>
            <button
              onClick={() => setActiveTab('module')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'module'
                  ? 'border-gray-700 text-gray-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Módulos
            </button>
            <button
              onClick={() => {
                setActiveTab('view');
                loadCertificates();
              }}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'view'
                  ? 'border-gray-700 text-gray-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="w-4 h-4" />
              Ver Certificados
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700 mx-auto"></div>
              <p className="text-gray-500 mt-2">Cargando...</p>
            </div>
          ) : (
            <>
              {/* Tab Curso Completo */}
              {activeTab === 'course' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Datos del Certificado (Opcional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horas Cursadas
                        </label>
                        <input
                          type="number"
                          value={courseForm.manualHours}
                          onChange={(e) => setCourseForm(prev => ({ ...prev, manualHours: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                          placeholder="Dejar vacío para usar valor del curso"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Inicio
                        </label>
                        <input
                          type="date"
                          value={courseForm.manualStartDate}
                          onChange={(e) => setCourseForm(prev => ({ ...prev, manualStartDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Finalización
                        </label>
                        <input
                          type="date"
                          value={courseForm.manualCompletionDate}
                          onChange={(e) => setCourseForm(prev => ({ ...prev, manualCompletionDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Firma Personalizada
                        </label>
                        <textarea
                          value={courseForm.customSignature}
                          onChange={(e) => setCourseForm(prev => ({ ...prev, customSignature: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                          placeholder="Escribe aquí el texto de la firma que aparecerá en el certificado. Dejar vacío para usar el texto por defecto."
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Estudiantes Elegibles</h3>
                      <button
                        onClick={handleSelectAll}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Seleccionar todos
                      </button>
                    </div>

                    {eligibleStudents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No hay estudiantes elegibles para certificados en este curso.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.length === eligibleStudents.filter(s => !s.has_certificate).length && selectedStudents.length > 0}
                                  onChange={handleSelectAll}
                                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha de Finalización</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {eligibleStudents.map((student) => (
                              <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedStudents.includes(student.id)}
                                    onChange={() => handleStudentSelect(student.id)}
                                    disabled={!!student.has_certificate}
                                    className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-900">{student.name}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{student.completion_date}</td>
                                <td className="px-4 py-3">
                                  {student.has_certificate ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Certificado Emitido
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Pendiente
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Módulos */}
              {activeTab === 'module' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Bookmark className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-900">Certificados por Módulo</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Aquí podrás generar certificados para estudiantes que hayan completado módulos específicos del curso.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Datos del Certificado de Módulo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre del Módulo *
                        </label>
                        <input
                          type="text"
                          value={moduleForm.moduleName}
                          onChange={(e) => setModuleForm(prev => ({ ...prev, moduleName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                          placeholder="Ej: Módulo 1 - Introducción"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horas del Módulo
                        </label>
                        <input
                          type="number"
                          value={moduleForm.moduleHours}
                          onChange={(e) => setModuleForm(prev => ({ ...prev, moduleHours: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                          placeholder="Ej: 8"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Inicio
                        </label>
                        <input
                          type="date"
                          value={moduleForm.moduleStartDate}
                          onChange={(e) => setModuleForm(prev => ({ ...prev, moduleStartDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Finalización
                        </label>
                        <input
                          type="date"
                          value={moduleForm.moduleCompletionDate}
                          onChange={(e) => setModuleForm(prev => ({ ...prev, moduleCompletionDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Firma Personalizada
                        </label>
                        <textarea
                          value={moduleForm.moduleCustomSignature}
                          onChange={(e) => setModuleForm(prev => ({ ...prev, moduleCustomSignature: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                          placeholder="Escribe aquí el texto de la firma que aparecerá en el certificado. Dejar vacío para usar el texto por defecto."
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={moduleForm.requiresRating}
                          onChange={(e) => setModuleForm(prev => ({ ...prev, requiresRating: e.target.checked }))}
                          className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                        />
                        <span className="text-sm text-gray-700">
                          Requiere calificación antes de descargar
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        Si está marcado, el estudiante deberá calificar el curso antes de poder descargar este certificado de módulo
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Estudiantes para Certificado de Módulo</h3>
                      <button
                        onClick={handleSelectAllModules}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Seleccionar todos
                      </button>
                    </div>

                    {eligibleStudents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No hay estudiantes inscritos en este curso.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                <input
                                  type="checkbox"
                                  checked={selectedModuleStudents.length === eligibleStudents.length && selectedModuleStudents.length > 0}
                                  onChange={handleSelectAllModules}
                                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado en Curso</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {eligibleStudents.map((student) => (
                              <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedModuleStudents.includes(student.id)}
                                    onChange={() => handleModuleStudentSelect(student.id)}
                                    className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-900">{student.name}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                                <td className="px-4 py-3">
                                  {student.completed_at ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Completado
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      En progreso
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Ver Certificados */}
              {activeTab === 'view' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Certificados del Curso</h3>
                  {certificates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay certificados emitidos para este curso.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número de Certificado</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha de Emisión</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {certificates.map((cert) => (
                            <tr key={cert.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{cert.student_name}</div>
                                <div className="text-sm text-gray-500">{cert.student_email}</div>
                              </td>
                              <td className="px-4 py-3">
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm">{cert.certificate_number}</code>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{cert.issue_date}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  cert.status === 'issued' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {cert.status === 'issued' ? 'Emitido' : 'Pendiente'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => viewCertificate(cert.id)}
                                    className="p-1 text-blue-600 hover:text-blue-800"
                                    title="Ver en navegador"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => downloadCertificate(cert.id)}
                                    className="p-1 text-green-600 hover:text-green-800"
                                    title="Descargar PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cerrar
          </button>
          
          {activeTab === 'course' && selectedStudents.length > 0 && (
            <button
              onClick={generateCertificates}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generando...
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" />
                  Generar Certificados
                </>
              )}
            </button>
          )}

          {activeTab === 'module' && selectedModuleStudents.length > 0 && moduleForm.moduleName && (
            <button
              onClick={generateModuleCertificates}
              disabled={generating}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generando...
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  Generar Certificados de Módulo
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
