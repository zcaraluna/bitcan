'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { 
  ArrowLeft,
  FileText,
  Save,
  AlertCircle
} from 'lucide-react';

interface Course {
  id: number;
  title: string;
  category_name?: string;
  level: string;
  duration_hours: number;
}

function CreateQuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course_id');
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    passing_score: 70,
    time_limit_minutes: '',
    is_required: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    } else {
      setError('ID de curso no proporcionado');
      setLoading(false);
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/professor/courses/${courseId}`);

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error al cargar el curso');
        return;
      }

      const result = await response.json();
      if (result.success) {
        setCourse(result.data);
      } else {
        setError('Error al cargar el curso');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Error al cargar el curso');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'El título del quiz es obligatorio.';
    }

    if (!formData.description.trim()) {
      errors.description = 'La descripción del quiz es obligatoria.';
    }

    if (formData.passing_score < 0 || formData.passing_score > 100) {
      errors.passing_score = 'El puntaje mínimo debe estar entre 0 y 100.';
    }

    if (formData.time_limit_minutes && parseInt(formData.time_limit_minutes) <= 0) {
      errors.time_limit_minutes = 'El límite de tiempo debe ser mayor a 0 minutos.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/professor/quizzes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: parseInt(courseId!),
          title: formData.title.trim(),
          description: formData.description.trim(),
          passing_score: formData.passing_score,
          time_limit_minutes: formData.time_limit_minutes ? parseInt(formData.time_limit_minutes) : null,
          is_required: formData.is_required ? 1 : 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Error al crear el quiz');
        return;
      }

      if (result.success) {
        showToast({ type: 'success', title: 'Quiz creado exitosamente', message: 'Ahora puedes agregar preguntas.' });
        router.push(`/dashboard_profesor/quizzes/${result.data.quiz_id}/edit`);
      } else {
        setError('Error al crear el quiz');
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      setError('Error al crear el quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !course) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              Volver
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Quiz</h1>
            <p className="text-gray-600 mt-1">Curso: <strong>{course.title}</strong></p>
            <div className="flex gap-2 mt-2">
              {course.category_name && (
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                  {course.category_name}
                </span>
              )}
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                {course.level}
              </span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                {course.duration_hours} horas
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Título del Quiz <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  formErrors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Quiz de Evaluación Final"
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  formErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe el contenido y objetivos del quiz..."
              />
              {formErrors.description && (
                <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
              )}
            </div>

            {/* Puntaje Mínimo */}
            <div>
              <label htmlFor="passing_score" className="block text-sm font-medium text-gray-700 mb-2">
                Puntaje Mínimo para Aprobar (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="passing_score"
                min="0"
                max="100"
                value={formData.passing_score}
                onChange={(e) => setFormData({ ...formData, passing_score: parseFloat(e.target.value) || 0 })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  formErrors.passing_score ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.passing_score && (
                <p className="mt-1 text-sm text-red-600">{formErrors.passing_score}</p>
              )}
            </div>

            {/* Límite de Tiempo */}
            <div>
              <label htmlFor="time_limit_minutes" className="block text-sm font-medium text-gray-700 mb-2">
                Límite de Tiempo (minutos) <span className="text-gray-500 text-xs">(Opcional)</span>
              </label>
              <input
                type="number"
                id="time_limit_minutes"
                min="1"
                value={formData.time_limit_minutes}
                onChange={(e) => setFormData({ ...formData, time_limit_minutes: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  formErrors.time_limit_minutes ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: 60 (dejar vacío para sin límite)"
              />
              {formErrors.time_limit_minutes && (
                <p className="mt-1 text-sm text-red-600">{formErrors.time_limit_minutes}</p>
              )}
            </div>

            {/* Obligatorio */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_required"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="is_required" className="ml-2 text-sm font-medium text-gray-700">
                Quiz Obligatorio
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {submitting ? 'Creando...' : 'Crear Quiz'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CreateQuizPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    }>
      <CreateQuizContent />
    </Suspense>
  );
}

