'use client';

/**
 * Página de gestión de plantillas de certificados
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CertificateTemplate } from '@/types/certificates';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/certificates/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/v2/certificates/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      const data = await response.json();
      
      if (data.success) {
        loadTemplates();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error toggling template:', error);
      alert('Error al actualizar plantilla');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const response = await fetch(`/api/v2/certificates/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      });

      const data = await response.json();
      
      if (data.success) {
        loadTemplates();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error setting default:', error);
      alert('Error al establecer plantilla por defecto');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v2/certificates/templates/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        loadTemplates();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error al eliminar plantilla');
    }
  };


  const handleDownloadExample = (template: CertificateTemplate) => {
    setSelectedTemplate(template);
    setShowExampleModal(true);
  };

  const handleGenerateExample = async (data: any) => {
    if (!selectedTemplate) return;

    const finalData = {
      ...data,
      completion_date: data.completion_date || new Date().toISOString(),
      certificate_number: data.certificate_number || `BIT2025${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    };

    console.log('Datos enviados:', finalData);

    try {
      const response = await fetch('/api/v2/certificates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          data: finalData
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ejemplo-${selectedTemplate.name}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setShowExampleModal(false);
        setSelectedTemplate(null);
      } else {
        alert('Error al generar ejemplo');
      }
    } catch (error) {
      console.error('Error generating example:', error);
      alert('Error al generar ejemplo');
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Plantillas de Certificados
            </h1>
            <p className="text-gray-600">
              Gestiona las plantillas HTML para los certificados
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Crear Plantilla
          </button>
        </div>

        {/* Lista de plantillas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="text-sm text-gray-600">{template.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {template.template_type === 'course_completion' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      Por defecto
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    template.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleToggleActive(template.id, template.is_active)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  {template.is_active ? 'Desactivar' : 'Activar'}
                </button>
                
                {template.template_type !== 'course_completion' && (
                  <button
                    onClick={() => handleSetDefault(template.id)}
                    className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                  >
                    Establecer por defecto
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setEditingTemplate(template);
                    setShowCreateModal(true);
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Editar
                </button>
                
                <button
                  onClick={() => handleDownloadExample(template)}
                  className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
                >
                  Descargar Ejemplo
                </button>
                
                {template.template_type !== 'course_completion' && (
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                <p>Tipo: {template.template_type}</p>
                <p>Creada: {new Date(template.created_at).toLocaleDateString('es-PY')}</p>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500 mb-4">No hay plantillas disponibles</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Crear Primera Plantilla
            </button>
          </div>
        )}

        {/* Modal para crear/editar plantilla */}
        {showCreateModal && (
          <CreateTemplateModal
            template={editingTemplate}
            onClose={() => {
              setShowCreateModal(false);
              setEditingTemplate(null);
            }}
            onSuccess={() => {
              loadTemplates();
              setShowCreateModal(false);
              setEditingTemplate(null);
            }}
          />
        )}

        {/* Modal para generar ejemplo personalizado */}
        {showExampleModal && selectedTemplate && (
          <ExampleDataModal
            template={selectedTemplate}
            onClose={() => {
              setShowExampleModal(false);
              setSelectedTemplate(null);
            }}
            onGenerate={handleGenerateExample}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// Modal para crear/editar plantillas
function CreateTemplateModal({ 
  template, 
  onClose, 
  onSuccess 
}: { 
  template?: CertificateTemplate | null; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    template_type: template?.template_type || 'course_completion',
    html_content: template?.html_content || `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificado</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .certificate { background: white; padding: 60px; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 800px; margin: 0 auto; }
    .title { font-size: 48px; color: #2563eb; margin-bottom: 30px; font-weight: bold; }
    .subtitle { font-size: 24px; color: #059669; margin-bottom: 40px; }
    .student-name { font-size: 36px; color: #1f2937; margin: 30px 0; font-weight: 600; }
    .course-title { font-size: 28px; color: #7c3aed; margin: 20px 0; font-weight: 500; }
    .details { font-size: 18px; color: #6b7280; margin: 15px 0; }
    .certificate-number { font-size: 16px; color: #374151; margin-top: 40px; font-weight: 600; }
    .border { border: 3px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="title">CERTIFICADO</div>
    <div class="subtitle">DE COMPLETACIÓN</div>
    
    <div class="border">
      <div class="student-name">{{student_name}}</div>
      <div class="details">ha completado exitosamente el curso</div>
      <div class="course-title">{{course_title}}</div>
    </div>
    
    <div class="details">
      <p>Duración: {{duration_hours}} horas</p>
      <p>Fecha de finalización: {{formatDate completion_date}}</p>
      <p>Instructores: {{instructor_names}}</p>
    </div>
    
    <div class="certificate-number">
      Certificado N° {{certificate_number}}
    </div>
  </div>
</body>
</html>`,
    css_styles: template?.css_styles || '',
    is_active: template?.is_active ?? true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = template 
        ? `/api/v2/certificates/templates/${template.id}`
        : '/api/v2/certificates/templates';
      
      const method = template ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(template ? 'Plantilla actualizada' : 'Plantilla creada');
        onSuccess();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error al guardar plantilla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {template ? 'Editar Plantilla' : 'Crear Plantilla'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={formData.template_type}
                onChange={(e) => setFormData({ ...formData, template_type: e.target.value as 'course_completion' | 'module_completion' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="course_completion">Completación de Curso</option>
                <option value="module_completion">Completación de Módulo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTML de la Plantilla
            </label>
            <div className="text-xs text-gray-500 mb-2">
              Variables disponibles: {'{student_name}'}, {'{course_title}'}, {'{duration_hours}'}, {'{completion_date}'}, {'{certificate_number}'}, {'{instructor_names}'}, {'{formatDate fecha}'}
            </div>
            <textarea
              value={formData.html_content}
              onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              rows={15}
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Activa</span>
            </label>

            {!template && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.template_type === 'course_completion'}
                  onChange={(e) => setFormData({ ...formData, template_type: e.target.checked ? 'course_completion' : 'module_completion' })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Plantilla por defecto</span>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (template ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para ingresar datos del ejemplo
function ExampleDataModal({ 
  template, 
  onClose, 
  onGenerate 
}: { 
  template: CertificateTemplate; 
  onClose: () => void; 
  onGenerate: (data: any) => void; 
}) {
  const [formData, setFormData] = useState({
    student_name: 'Juan Pérez',
    course_title: 'Curso de Ejemplo',
    duration_hours: 40,
    completion_date: new Date().toISOString().split('T')[0],
    certificate_number: `BIT2025${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    custom_signature: 'Dr. María González\nInstructora Principal'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onGenerate(formData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Generar Ejemplo - {template.name}
          </h2>
          <p className="text-gray-600 mt-1">
            Ingresa los datos que quieres mostrar en el certificado de ejemplo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Estudiante
              </label>
              <input
                type="text"
                value={formData.student_name}
                onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del Curso
              </label>
              <input
                type="text"
                value={formData.course_title}
                onChange={(e) => setFormData({ ...formData, course_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración (horas)
              </label>
              <input
                type="number"
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Finalización
              </label>
              <input
                type="date"
                value={formData.completion_date}
                onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Certificado
              </label>
              <input
                type="text"
                value={formData.certificate_number}
                onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Firma Personalizada
              </label>
              <textarea
                value={formData.custom_signature}
                onChange={(e) => setFormData({ ...formData, custom_signature: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Ej: Dr. María González&#10;Instructora Principal&#10;BITCAN"
              />
              <p className="text-xs text-gray-500 mt-1">Puedes usar saltos de línea con Enter</p>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Generando...' : 'Generar Ejemplo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

