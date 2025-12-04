'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import CertificateModal from '@/components/CertificateModal';
import { 
  Award, 
  Plus, 
  Eye,
  Trash2,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Palette,
  Edit,
  Save,
  Star,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface Certificate {
  id: number;
  certificate_number: string;
  user_id: number;
  course_id: number;
  issue_date: string;
  status: string;
  student_name: string;
  student_email: string;
  course_title: string;
}

interface Course {
  id: number;
  title: string;
}

interface Template {
  id: number;
  name: string;
  description: string;
  template_html: string;
  is_default: number;
  is_active: number;
  created_at: string;
  created_by_name: string;
}

export default function ManageCertificates() {
  const [activeTab, setActiveTab] = useState<'certificates' | 'templates'>('certificates');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<number>(0);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadCourses();
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCourse > 0 && activeTab === 'certificates') {
      loadCertificates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse, activeTab]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/certificates/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);
        if (data.courses.length > 0 && selectedCourse === 0) {
          setSelectedCourse(data.courses[0].id);
        }
      } else {
        setError('Error al cargar cursos');
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadCertificates = async () => {
    if (selectedCourse === 0) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/certificates?course_id=${selectedCourse}`);
      if (response.ok) {
        const data = await response.json();
        setCertificates(data.certificates);
      } else {
        setError('Error al cargar certificados');
      }
    } catch (error) {
      console.error('Error loading certificates:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      } else {
        setError('Error al cargar plantillas');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('Error de conexión');
    }
  };

  const handleRevoke = async (certId: number) => {
    if (!confirm('¿Estás seguro de que quieres revocar este certificado?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/certificates/${certId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Certificado revocado exitosamente');
        loadCertificates();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al revocar certificado');
      }
    } catch (error) {
      console.error('Error revoking certificate:', error);
      setError('Error de conexión');
    }
  };

  const handleToggleActive = async (templateId: number, currentStatus: number) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          template_html: template.template_html,
          is_default: template.is_default,
          is_active: currentStatus ? 0 : 1
        }),
      });

      if (response.ok) {
        setSuccess(`Plantilla ${currentStatus ? 'desactivada' : 'activada'} exitosamente`);
        loadTemplates();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Error al actualizar plantilla');
      }
    } catch (error) {
      console.error('Error toggling template:', error);
      setError('Error de conexión');
    }
  };

  const handleSetDefault = async (templateId: number) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          template_html: template.template_html,
          is_default: 1,
          is_active: 1
        }),
      });

      if (response.ok) {
        setSuccess('Plantilla establecida como predeterminada');
        loadTemplates();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Error al actualizar plantilla');
      }
    } catch (error) {
      console.error('Error setting default template:', error);
      setError('Error de conexión');
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Plantilla eliminada exitosamente');
        loadTemplates();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Error al eliminar plantilla');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Error de conexión');
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowTemplateEditor(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateEditor(true);
  };

  const handleSaveTemplate = async (templateData: any) => {
    try {
      const url = editingTemplate 
        ? `/api/admin/templates/${editingTemplate.id}`
        : '/api/admin/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        setSuccess(editingTemplate ? 'Plantilla actualizada exitosamente' : 'Plantilla creada exitosamente');
        setShowTemplateEditor(false);
        loadTemplates();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Error al guardar plantilla');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Error de conexión');
    }
  };

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Award className="w-8 h-8 text-gray-600" />
                Gestionar Certificados
              </h1>
              <p className="text-gray-600 mt-1">Genera certificados y diseña plantillas personalizadas</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('certificates')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'certificates'
                    ? 'border-gray-700 text-gray-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Award className="w-4 h-4" />
                Emitir Certificados
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'templates'
                    ? 'border-gray-700 text-gray-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Palette className="w-4 h-4" />
                Diseñar Plantillas
              </button>
            </nav>
          </div>

          {activeTab === 'certificates' && (
            <div className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 flex items-center gap-4">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar Curso
                    </label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value={0}>Seleccione un curso</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setShowCertificateModal(true)}
                    disabled={selectedCourse === 0}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Generar Certificados
                  </button>
                </div>
              </div>

              {selectedCourse > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Certificados Emitidos
                  </h2>

                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              N° Certificado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estudiante
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha de Emisión
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {certificates.map((cert) => (
                            <tr key={cert.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Award className="w-4 h-4 text-gray-400" />
                                  <span className="font-mono font-bold text-gray-900">{cert.certificate_number}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">{cert.student_name}</div>
                                <div className="text-xs text-gray-500">{cert.student_email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(cert.issue_date).toLocaleDateString('es-PY')}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {cert.status === 'issued' ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Emitido
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Revocado
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`/certificates/${cert.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Ver certificado"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </a>
                                  <a
                                    href={`/api/admin/certificates/${cert.id}/download-pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-800"
                                    title="Descargar PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                  {cert.status === 'issued' && (
                                    <button
                                      onClick={() => handleRevoke(cert.id)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Revocar"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {certificates.length === 0 && (
                        <div className="text-center text-gray-500 py-12">
                          No hay certificados emitidos para este curso
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Plantillas de Certificados</h2>
                <button
                  onClick={handleCreateTemplate}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Plantilla
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          {template.name}
                          {template.is_default === 1 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Star className="w-3 h-3 mr-1" />
                              Por defecto
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Creado por {template.created_by_name} el {new Date(template.created_at).toLocaleDateString('es-PY')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleActive(template.id, template.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          template.is_active
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={template.is_active ? 'Activa' : 'Inactiva'}
                      >
                        {template.is_active ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      {template.is_default === 0 && (
                        <button
                          onClick={() => handleSetDefault(template.id)}
                          className="flex-1 px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2 text-sm transition-colors"
                        >
                          <Star className="w-4 h-4" />
                          Por defecto
                        </button>
                      )}
                      {template.is_default === 0 && (
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2 text-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {templates.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  No hay plantillas creadas. Crea una nueva plantilla para comenzar.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showCertificateModal && selectedCourseData && (
        <CertificateModal
          courseId={selectedCourse}
          courseTitle={selectedCourseData.title}
          onClose={() => setShowCertificateModal(false)}
        />
      )}

      {showTemplateEditor && (
        <TemplateEditorModal
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onClose={() => setShowTemplateEditor(false)}
        />
      )}
    </DashboardLayout>
  );
}

interface TemplateEditorModalProps {
  template: Template | null;
  onSave: (data: any) => void;
  onClose: () => void;
}

function TemplateEditorModal({ template, onSave, onClose }: TemplateEditorModalProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [templateHtml, setTemplateHtml] = useState(template?.template_html || getDefaultTemplate());
  const [isDefault, setIsDefault] = useState(template?.is_default === 1 || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      template_html: templateHtml,
      is_default: isDefault,
      is_active: 1
    });
  };

  const previewHtml = templateHtml
    .replace(/\{\{STUDENT_NAME\}\}/g, 'Juan Pérez García')
    .replace(/\{\{COURSE_NAME\}\}/g, 'Ciberseguridad Avanzada')
    .replace(/\{\{DURATION_HOURS\}\}/g, '40')
    .replace(/\{\{START_DATE\}\}/g, '01/01/2025')
    .replace(/\{\{COMPLETION_DATE\}\}/g, '15/10/2025')
    .replace(/\{\{CERTIFICATE_NUMBER\}\}/g, 'BIT2025ABC123')
    .replace(/\{\{INSTRUCTOR_NAME\}\}/g, 'BITCAN')
    .replace(/\{\{CUSTOM_SIGNATURE\}\}/g, 'El mencionado curso ha sido dictado por\nBITCAN');

  const handlePreviewPDF = async () => {
    try {
      // Mostrar loading
      const loadingToast = document.createElement('div');
      loadingToast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      loadingToast.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Generando PDF...';
      document.body.appendChild(loadingToast);

      const response = await fetch('/api/admin/certificates/preview-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: previewHtml }),
      });

      document.body.removeChild(loadingToast);

      if (!response.ok) {
        const error = await response.json();
        alert(`Error al generar PDF: ${error.error}\n${error.details || ''}\n${error.suggestion || ''}`);
        return;
      }

      // Descargar el PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preview-certificado-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleDownloadHTML = () => {
    // Crear un blob con el HTML
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preview-certificado-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Palette className="w-6 h-6 text-gray-600" />
              {template ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-6 h-full">
              <div className="p-6 border-r border-gray-200 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Plantilla
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="Ej: Plantilla Moderna"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="Descripción de la plantilla"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
                      Establecer como plantilla predeterminada
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HTML del Certificado
                    </label>
                    <textarea
                      value={templateHtml}
                      onChange={(e) => setTemplateHtml(e.target.value)}
                      rows={25}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-mono text-xs"
                      placeholder="Código HTML del certificado"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-medium mb-2">Variables disponibles:</p>
                    <div className="text-xs text-blue-700 font-mono space-y-1">
                      <div className="flex gap-2 flex-wrap">
                        <code className="bg-white px-2 py-1 rounded">{'{'}{'{'} STUDENT_NAME {'}'}{'}'}</code>
                        <code className="bg-white px-2 py-1 rounded">{'{'}{'{'} COURSE_NAME {'}'}{'}'}</code>
                        <code className="bg-white px-2 py-1 rounded">{'{'}{'{'} DURATION_HOURS {'}'}{'}'}</code>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <code className="bg-white px-2 py-1 rounded">{'{'}{'{'} START_DATE {'}'}{'}'}</code>
                        <code className="bg-white px-2 py-1 rounded">{'{'}{'{'} COMPLETION_DATE {'}'}{'}'}</code>
                        <code className="bg-white px-2 py-1 rounded">{'{'}{'{'} CERTIFICATE_NUMBER {'}'}{'}'}</code>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <code className="bg-white px-2 py-1 rounded">{'{'}{'{'} INSTRUCTOR_NAME {'}'}{'}'}</code>
                        <code className="bg-white px-2 py-1 rounded">{'{'}{'{'} CUSTOM_SIGNATURE {'}'}{'}'}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Vista Previa (Orientación Horizontal)
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadHTML}
                      className="px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-1 transition-colors"
                      title="Descargar HTML para pruebas"
                    >
                      <Download className="w-3 h-3" />
                      HTML
                    </button>
                    <button
                      type="button"
                      onClick={handlePreviewPDF}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 transition-colors"
                      title="Generar y descargar PDF usando wkhtmltopdf"
                    >
                      <Download className="w-3 h-3" />
                      Generar PDF
                    </button>
                  </div>
                </div>
                <div className="bg-white border-2 border-gray-300 rounded-lg overflow-auto flex items-center justify-center p-4" style={{ height: '550px' }}>
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-full"
                      title="Preview"
                      style={{ 
                        border: 'none',
                        transform: 'scale(0.4)',
                        transformOrigin: 'center center',
                        width: '250%',
                        height: '250%',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginLeft: '-125%',
                        marginTop: '-125%'
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  El certificado se verá en formato A4 horizontal (landscape). Usa &quot;Generar PDF&quot; para descargar usando wkhtmltopdf.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar Plantilla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getDefaultTemplate(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Certificado BITCAN</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: "Times New Roman", serif;
            background: #ffffff;
            overflow: hidden;
        }
        
        .certificate-container {
            width: 100vw;
            height: 100vh;
            background: #ffffff;
            border: 12px solid #2E5090;
            position: relative;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
        }
        
        /* Header */
        .certificate-header {
            background: linear-gradient(135deg, #2E5090 0%, #1e3a5f 100%);
            color: white;
            padding: 25px 50px;
            text-align: center;
            height: 90px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
        }
        
        .logo-text {
            font-size: 3rem;
            font-weight: bold;
            letter-spacing: 4px;
            margin-bottom: 5px;
        }
        
        .subtitle {
            font-size: 1rem;
            font-weight: 500;
            letter-spacing: 1px;
            text-transform: uppercase;
            opacity: 0.9;
        }
        
        /* Body */
        .certificate-body {
            flex: 1;
            padding: 20px 70px 50px 70px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: #fafafa;
            position: relative;
            min-height: 0;
        }
        
        .certificate-logo {
            max-width: 90px;
            height: auto;
            display: block;
            margin: 0 auto 20px auto;
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.15));
        }
        
        .presentation-text {
            font-size: 1.4rem;
            color: #333;
            margin-bottom: 20px;
            font-weight: 500;
        }
        
        .certificate-title {
            font-size: 3.2rem;
            font-weight: bold;
            color: #2E5090;
            margin-bottom: 25px;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        
        .student-name {
            font-size: 2.2rem;
            font-weight: bold;
            color: #2E5090;
            margin-bottom: 25px;
            border-bottom: 4px solid #2E5090;
            padding-bottom: 15px;
            min-width: 450px;
        }
        
        .achievement-text {
            font-size: 1.4rem;
            color: #333;
            margin-bottom: 35px;
            font-weight: 500;
            max-width: 550px;
            line-height: 1.5;
        }
        
        .course-name {
            font-weight: bold;
            color: #2E5090;
            font-size: 1.5rem;
        }
        
        .certificate-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 35px;
            padding: 25px 35px;
            background: #ffffff;
            border: 3px solid #e0e0e0;
            width: 100%;
            max-width: 750px;
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        
        .detail-item {
            text-align: center;
            flex: 1;
        }
        
        .detail-label {
            font-size: 0.9rem;
            color: #666;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        
        .detail-value {
            font-size: 1.1rem;
            color: #2E5090;
            font-weight: bold;
        }
        
        /* Footer */
        .certificate-footer {
            background: linear-gradient(135deg, #2E5090 0%, #1e3a5f 100%);
            color: white;
            padding: 25px 50px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 120px;
            flex-shrink: 0;
            width: 100%;
        }
        
        .instructor-notice {
            font-size: 1.1rem;
            font-weight: 500;
            text-align: left;
            line-height: 1.6;
            max-width: 70%;
            white-space: pre-line;
        }
        
        .instructor-name {
            font-weight: bold;
            font-size: 1.1rem;
            display: block;
            margin-top: 3px;
        }
        
        .certificate-number {
            font-size: 1rem;
            font-weight: bold;
            text-align: right;
            max-width: 30%;
        }
        
        /* Watermark */
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 5rem;
            color: rgba(46, 80, 144, 0.06);
            font-weight: bold;
            pointer-events: none;
            z-index: 1;
        }
        
        .security-pattern {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: transparent;
            background-image: radial-gradient(circle, rgba(46, 80, 144, 0.12) 1.5px, transparent 1.5px);
            background-size: 14px 14px;
            background-position: 0 0;
            pointer-events: none;
            z-index: 0;
        }
        
        /* Ensure content is above patterns */
        .certificate-header,
        .certificate-body,
        .certificate-footer {
            position: relative;
            z-index: 2;
        }
        
        /* Decorative corners */
        .corner {
            position: absolute;
            width: 40px;
            height: 40px;
            border: 4px solid #2E5090;
        }
        
        .corner-tl {
            top: 20px;
            left: 20px;
            border-right: none;
            border-bottom: none;
        }
        
        .corner-tr {
            top: 20px;
            right: 20px;
            border-left: none;
            border-bottom: none;
        }
        
        .corner-bl {
            bottom: 20px;
            left: 20px;
            border-right: none;
            border-top: none;
        }
        
        .corner-br {
            bottom: 20px;
            right: 20px;
            border-left: none;
            border-top: none;
        }
        
        /* Print styles */
        @media print {
            html, body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
            }
            
            .certificate-container {
                width: 100%;
                height: 100%;
                border: 12px solid #2E5090;
            }
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <!-- Security pattern con motas -->
        <div class="security-pattern"></div>
        
        <!-- Watermark -->
        <div class="watermark">BITCAN</div>
        
        <!-- Decorative corners -->
        <div class="corner corner-tl"></div>
        <div class="corner corner-tr"></div>
        <div class="corner corner-bl"></div>
        <div class="corner corner-br"></div>
        
        <!-- Header -->
        <div class="certificate-header">
            <div class="logo-text">BITCAN</div>
            <div class="subtitle">Prevención a través de la Educación</div>
        </div>
        
        <!-- Body -->
        <div class="certificate-body">
            <img src="https://bitcan.com.py/bitcan-logo.png" alt="Logo BITCAN" class="certificate-logo">

            <div class="presentation-text">Se otorga el presente</div>
            
            <div class="certificate-title">Certificado</div>
            
            <div class="presentation-text">a</div>
            
            <div class="student-name">{{STUDENT_NAME}}</div>
            
            <div class="achievement-text">
                por haber completado exitosamente el curso<br>
                <span class="course-name">"{{COURSE_NAME}}"</span>
            </div>
            
            <div class="certificate-details">
                <div class="detail-item">
                    <div class="detail-label">Horas Cursadas</div>
                    <div class="detail-value">{{DURATION_HOURS}} horas</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Fecha de Inicio</div>
                    <div class="detail-value">{{START_DATE}}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Fecha de Finalización</div>
                    <div class="detail-value">{{COMPLETION_DATE}}</div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="certificate-footer">
            <div class="instructor-notice">
                {{CUSTOM_SIGNATURE}}
                {{#if CUSTOM_MESSAGE}}
                <div style="margin-top: 15px; font-size: 0.95rem; font-weight: 400; line-height: 1.5;">
                    {{CUSTOM_MESSAGE}}
                </div>
                {{/if}}
            </div>
            
            <div class="certificate-number">
                Certificado N°: {{CERTIFICATE_NUMBER}}
            </div>
        </div>
    </div>
</body>
</html>`;
}

