'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  BookOpen, 
  Users, 
  FileText, 
  MessageSquare,
  Download,
  ExternalLink,
  Eye,
  ArrowLeft,
  CheckCircle,
  Award,
  AlertCircle,
  Edit,
  Plus,
  X,
  Upload
} from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  short_description?: string;
  identifier: string;
  category_name?: string;
  category_id?: number;
  level: string;
  duration_hours: number;
  duration_minutes?: number;
  status: string;
  total_estudiantes: number;
  total_lecciones: number;
  progreso_promedio: number;
  price?: number;
  price_pyg?: number;
  is_free?: number;
  enrollment_start_date?: string;
  enrollment_end_date?: string;
  course_start_date?: string;
  course_end_date?: string;
  max_students?: number;
  requires_approval?: number;
  requirements?: string;
  learning_objectives?: string;
  thumbnail_url?: string;
  video_url?: string;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  estudiantes_completaron: number;
  total_recursos: number;
}

interface Student {
  id: number;
  name: string;
  email: string;
  progress: number;
  started_at: string;
  completed_at?: string;
  completed?: boolean;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  lecciones_completadas: number;
}

interface Resource {
  id: number;
  source_type: 'lesson' | 'course';
  title: string;
  description?: string;
  file_path?: string;
  url?: string;
  file_size?: number;
  file_type?: string;
  lesson_title: string;
  user_name?: string;
  created_at: string;
}

interface Quiz {
  id: number;
  title: string;
  description?: string;
  total_preguntas: number;
  estudiantes_completaron: number;
  puntuacion_promedio: number;
  passing_score: number;
  time_limit_minutes?: number;
  is_required: number;
}

interface Stats {
  total_inscritos: number;
  completados: number;
  progreso_promedio: number;
  total_lecciones: number;
  lecciones_completadas_total: number;
}

type Tab = 'overview' | 'lessons' | 'students' | 'comments' | 'resources' | 'quizzes';

function CourseManagementContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params.id as string;
  const activeTab = (searchParams.get('tab') || 'overview') as Tab;

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    url: '',
    file: null as File | null
  });
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [creatingLesson, setCreatingLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content: '',
    duration_minutes: '',
    video_url: '',
    sort_order: ''
  });
  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/professor/courses/${courseId}`);

      if (!response.ok) {
        if (response.status === 403) {
          setError('No tienes permisos para acceder a este curso');
        } else if (response.status === 404) {
          setError('Curso no encontrado');
        } else {
          setError('Error al cargar el curso');
        }
        return;
      }

      const result = await response.json();
      if (result.success) {
        setCourse(result.data.course);
        setLessons(result.data.lessons);
        setStudents(result.data.students);
        setResources(result.data.resources);
        setQuizzes(result.data.quizzes);
        setStats(result.data.stats);
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


  const handleTabChange = (tab: Tab) => {
    router.push(`/dashboard_profesor/courses/${courseId}?tab=${tab}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleOpenEditLesson = async (lessonId: number) => {
    try {
      const response = await fetch(`/api/professor/courses/${courseId}/lessons/${lessonId}`);
      if (!response.ok) {
        setError('Error al cargar la lección');
        return;
      }

      const result = await response.json();
      if (result.success && result.data.lesson) {
        const lesson = result.data.lesson;
        setLessonForm({
          title: lesson.title || '',
          description: lesson.description || '',
          content: lesson.content || '',
          duration_minutes: lesson.duration_minutes?.toString() || '',
          video_url: lesson.video_url || '',
          sort_order: lesson.sort_order?.toString() || ''
        });
        setEditingLesson(lessonId);
        setShowLessonModal(true);
        setError(null);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      setError('Error al cargar la lección');
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonForm.title.trim()) {
      setError('El título es requerido');
      return;
    }

    try {
      setCreatingLesson(true);
      setError(null);

      const response = await fetch(`/api/professor/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: lessonForm.title.trim(),
          description: lessonForm.description.trim() || null,
          content: lessonForm.content.trim() || null,
          duration_minutes: lessonForm.duration_minutes ? parseInt(lessonForm.duration_minutes) : null,
          video_url: lessonForm.video_url.trim() || null,
          sort_order: lessonForm.sort_order ? parseInt(lessonForm.sort_order) : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Error al crear la lección');
        return;
      }

      if (result.success) {
        setShowLessonModal(false);
        setLessonForm({
          title: '',
          description: '',
          content: '',
          duration_minutes: '',
          video_url: '',
          sort_order: ''
        });
        setEditingLesson(null);
        fetchCourseData();
      }
    } catch (error) {
      console.error('Error creating lesson:', error);
      setError('Error al crear la lección');
    } finally {
      setCreatingLesson(false);
    }
  };

  const handleUpdateLesson = async () => {
    if (!lessonForm.title.trim()) {
      setError('El título es requerido');
      return;
    }

    if (!editingLesson) {
      setError('ID de lección no válido');
      return;
    }

    try {
      setCreatingLesson(true);
      setError(null);

      const response = await fetch(`/api/professor/courses/${courseId}/lessons/${editingLesson}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: lessonForm.title.trim(),
          description: lessonForm.description.trim() || null,
          content: lessonForm.content.trim() || null,
          duration_minutes: lessonForm.duration_minutes ? parseInt(lessonForm.duration_minutes) : null,
          video_url: lessonForm.video_url.trim() || null,
          sort_order: lessonForm.sort_order ? parseInt(lessonForm.sort_order) : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Error al actualizar la lección');
        return;
      }

      if (result.success) {
        setShowLessonModal(false);
        setLessonForm({
          title: '',
          description: '',
          content: '',
          duration_minutes: '',
          video_url: '',
          sort_order: ''
        });
        setEditingLesson(null);
        fetchCourseData();
      }
    } catch (error) {
      console.error('Error updating lesson:', error);
      setError('Error al actualizar la lección');
    } finally {
      setCreatingLesson(false);
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

  if (error || !course || !stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || 'Error desconocido'}</p>
            <button
              onClick={() => router.push('/dashboard_profesor')}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard_profesor')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 mt-1">{course.short_description || course.description}</p>
            <div className="flex gap-2 mt-2">
              {course.category_name && (
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  {course.category_name}
                </span>
              )}
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
              </span>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                {course.duration_hours} horas
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{stats.total_inscritos}</div>
            <div className="text-sm text-gray-600">Estudiantes</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.total_inscritos}</div>
            <div className="text-sm text-gray-600">Estudiantes Inscritos</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.completados}</div>
            <div className="text-sm text-gray-600">Completados</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.total_lecciones}</div>
            <div className="text-sm text-gray-600">Lecciones</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <Award className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.lecciones_completadas_total}</div>
            <div className="text-sm text-gray-600">Completadas</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => handleTabChange('overview')}
                className={`px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-green-600 text-green-600 bg-green-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Resumen
              </button>
              <button
                onClick={() => handleTabChange('lessons')}
                className={`px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === 'lessons'
                    ? 'border-b-2 border-green-600 text-green-600 bg-green-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Lecciones
              </button>
              <button
                onClick={() => handleTabChange('students')}
                className={`px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === 'students'
                    ? 'border-b-2 border-green-600 text-green-600 bg-green-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Estudiantes
              </button>
              <button
                onClick={() => handleTabChange('resources')}
                className={`px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === 'resources'
                    ? 'border-b-2 border-green-600 text-green-600 bg-green-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Recursos
              </button>
              <button
                onClick={() => handleTabChange('quizzes')}
                className={`px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === 'quizzes'
                    ? 'border-b-2 border-green-600 text-green-600 bg-green-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Quizzes
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Información del Curso</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h6 className="font-semibold text-gray-900 mb-3">Detalles Generales</h6>
                        <ul className="space-y-2 text-sm">
                          <li><strong>Identificador:</strong> {course.identifier}</li>
                          <li>
                            <strong>Estado:</strong>{' '}
                            <span className={`px-2 py-1 rounded text-xs ${
                              course.status === 'activo' ? 'bg-green-100 text-green-800' :
                              course.status === 'culminado' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                            </span>
                          </li>
                          {course.category_name && (
                            <li><strong>Categoría:</strong> {course.category_name}</li>
                          )}
                          <li><strong>Nivel:</strong> {course.level.charAt(0).toUpperCase() + course.level.slice(1)}</li>
                          <li><strong>Duración:</strong> {course.duration_hours} horas</li>
                        </ul>
                      </div>
                    </div>
                    {course.description && (
                      <>
                        <hr className="my-4" />
                        <h6 className="font-semibold text-gray-900 mb-2">Descripción Completa</h6>
                        <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Estadísticas Rápidas</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Estudiantes Activos</span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {stats.total_inscritos}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Cursos Completados</span>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {stats.completados}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Lecciones Totales</span>
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          {stats.total_lecciones}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Lecciones Completadas</span>
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                          {stats.lecciones_completadas_total}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lessons' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Lecciones del Curso</h2>
                  <div className="flex items-center gap-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {lessons.length} lecciones
                    </span>
                    <button
                      onClick={() => setShowLessonModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Nueva Lección
                    </button>
                  </div>
                </div>
                {lessons.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No hay lecciones en este curso</h5>
                    <p className="text-gray-600">Los administradores agregarán lecciones cuando estén disponibles.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lessons.map((lesson) => (
                      <div key={lesson.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all border-l-4 border-l-green-500">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h6 className="font-semibold text-lg text-gray-900 mb-1">{lesson.title}</h6>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                              {lesson.description?.substring(0, 60)}...
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {lesson.duration_minutes} min
                            </span>
                            <br />
                            <small className="text-gray-500 text-xs mt-1 block">
                              {lesson.total_recursos} recursos
                            </small>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <small className="text-gray-500">
                            {lesson.estudiantes_completaron} estudiantes completaron
                          </small>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenEditLesson(lesson.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar Lección"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard_profesor/courses/${courseId}/lessons/${lesson.id}`)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Ver Lección"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Estudiantes Inscritos</h2>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {students.length} estudiantes
                  </span>
                </div>
                {students.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No hay estudiantes inscritos</h5>
                    <p className="text-gray-600">Los estudiantes aparecerán aquí una vez que se inscriban.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Estudiante</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Progreso</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Lecciones</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Inscripción</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {students.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <strong className="text-gray-900">{student.name}</strong>
                                {student.nombres && student.apellidos && (
                                  <>
                                    <br />
                                    <small className="text-gray-500">
                                      {student.nombres} {student.apellidos}
                                    </small>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                            <td className="px-4 py-3">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mb-1">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${student.progress}%` }}
                                />
                              </div>
                              <small className="text-gray-500 text-xs">{student.progress}%</small>
                            </td>
                            <td className="px-4 py-3">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                {student.lecciones_completadas} / {stats.total_lecciones}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(student.started_at)}</td>
                            <td className="px-4 py-3">
                              {student.completed || student.completed_at ? (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                  Completado
                                </span>
                              ) : (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                  En Progreso
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => router.push(`/dashboard_profesor/courses/${courseId}/students/${student.id}`)}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Ver Progreso"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm(`¿Estás seguro de ${student.completed ? 'desmarcar' : 'marcar'} este estudiante como aprobado?`)) return;
                                    try {
                                      const response = await fetch(`/api/professor/courses/${courseId}/students/${student.id}/complete`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ completed: !student.completed }),
                                      });
                                      const data = await response.json();
                                      if (data.success) {
                                        fetchCourseData();
                                      } else {
                                        alert(data.error || 'Error al actualizar el estado');
                                      }
                                    } catch (error) {
                                      console.error('Error:', error);
                                      alert('Error al actualizar el estado');
                                    }
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${
                                    student.completed
                                      ? 'text-yellow-600 hover:bg-yellow-50'
                                      : 'text-green-600 hover:bg-green-50'
                                  }`}
                                  title={student.completed ? 'Desmarcar como aprobado' : 'Marcar como aprobado'}
                                >
                                  <CheckCircle className={`w-4 h-4 ${student.completed ? '' : 'opacity-50'}`} />
                                </button>
                                <button
                                  onClick={() => router.push(`/dashboard_profesor/messages?to=${student.id}`)}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Enviar Mensaje"
                                >
                                  <MessageSquare className="w-4 h-4" />
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

            {activeTab === 'resources' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Recursos del Curso</h2>
                  <div className="flex items-center gap-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {resources.length} recursos
                    </span>
                    <button
                      onClick={() => setShowAddResourceModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Recurso
                    </button>
                  </div>
                </div>
                {resources.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No hay recursos en este curso</h5>
                    <p className="text-gray-600">Agrega recursos para complementar el contenido del curso.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resources.map((resource) => (
                      <div key={resource.id} className="border border-gray-200 rounded-xl p-5 border-l-4 border-l-purple-500">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h6 className="font-semibold text-gray-900 mb-2">{resource.title}</h6>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                {resource.source_type === 'lesson' ? 'Lección' : 'Curso'}
                              </span>
                              <small className="text-gray-500">{resource.lesson_title}</small>
                            </div>
                            {resource.description && (
                              <p className="text-gray-600 text-sm mb-2">{resource.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                              {resource.file_path && (
                                <>
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                    {resource.file_type?.toUpperCase() || 'ARCHIVO'}
                                  </span>
                                  {resource.file_size && (
                                    <small className="text-gray-500">{formatFileSize(resource.file_size)}</small>
                                  )}
                                </>
                              )}
                              {resource.url && (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">URL</span>
                              )}
                              {resource.user_name && (
                                <small className="text-gray-500">
                                  Por {resource.user_name}
                                </small>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            {resource.file_path ? (
                              <a
                                href={`/api/resources/download?id=${resource.id}&type=${resource.source_type}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Descargar"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            ) : resource.url ? (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Ver"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : null}
                            {resource.source_type === 'course' && (
                              <button
                                onClick={async () => {
                                  if (confirm('¿Estás seguro de eliminar este recurso?')) {
                                    try {
                                      const response = await fetch(
                                        `/api/professor/courses/${courseId}/resources?resourceId=${resource.id}`,
                                        { method: 'DELETE' }
                                      );
                                      const data = await response.json();
                                      if (data.success) {
                                        fetchCourseData();
                                      } else {
                                        alert(`Error: ${data.error}`);
                                      }
                                    } catch (error) {
                                      console.error('Error deleting resource:', error);
                                      alert('Error al eliminar el recurso');
                                    }
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                title="Eliminar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modal para agregar recurso */}
            {showAddResourceModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">Agregar Recurso del Curso</h3>
                    <button
                      onClick={() => {
                        setShowAddResourceModal(false);
                        setResourceForm({ title: '', description: '', url: '', file: null });
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!resourceForm.title) {
                        alert('El título es requerido');
                        return;
                      }
                      if (!resourceForm.file && !resourceForm.url) {
                        alert('Debe proporcionar un archivo o una URL');
                        return;
                      }

                      try {
                        setUploadingResource(true);
                        const formData = new FormData();
                        formData.append('title', resourceForm.title);
                        formData.append('description', resourceForm.description);
                        if (resourceForm.url) {
                          formData.append('url', resourceForm.url);
                        }
                        if (resourceForm.file) {
                          formData.append('file', resourceForm.file);
                        }

                        const response = await fetch(`/api/professor/courses/${courseId}/resources`, {
                          method: 'POST',
                          body: formData,
                        });

                        const data = await response.json();

                        if (data.success) {
                          setShowAddResourceModal(false);
                          setResourceForm({ title: '', description: '', url: '', file: null });
                          fetchCourseData();
                        } else {
                          alert(`Error: ${data.error}`);
                        }
                      } catch (error) {
                        console.error('Error uploading resource:', error);
                        alert('Error al subir el recurso');
                      } finally {
                        setUploadingResource(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título *
                      </label>
                      <input
                        type="text"
                        value={resourceForm.title}
                        onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={resourceForm.description}
                        onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL (opcional, si no subes archivo)
                      </label>
                      <input
                        type="url"
                        value={resourceForm.url}
                        onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Archivo (opcional, si no proporcionas URL)
                      </label>
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setResourceForm({ ...resourceForm, file });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      {resourceForm.file && (
                        <p className="mt-2 text-sm text-gray-600">
                          Archivo seleccionado: {resourceForm.file.name} ({(resourceForm.file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={uploadingResource}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {uploadingResource ? (
                          <>
                            <LoadingSpinner />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Subir Recurso
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddResourceModal(false);
                          setResourceForm({ title: '', description: '', url: '', file: null });
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal para crear lección */}
            {showLessonModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">Nueva Lección</h3>
                    <button
                      onClick={() => {
                        setShowLessonModal(false);
                        setLessonForm({
                          title: '',
                          description: '',
                          content: '',
                          duration_minutes: '',
                          video_url: '',
                          sort_order: ''
                        });
                        setError(null);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                      {error}
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editingLesson) {
                        handleUpdateLesson();
                      } else {
                        handleCreateLesson();
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título *
                      </label>
                      <input
                        type="text"
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                        placeholder="Ej: Introducción a la Criminalística"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={lessonForm.description}
                        onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows={3}
                        placeholder="Breve descripción de la lección"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contenido
                      </label>
                      <textarea
                        value={lessonForm.content}
                        onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows={6}
                        placeholder="Contenido completo de la lección (texto, HTML, etc.)"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duración (minutos)
                        </label>
                        <input
                          type="number"
                          value={lessonForm.duration_minutes}
                          onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          min="1"
                          placeholder="30"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Orden
                        </label>
                        <input
                          type="number"
                          value={lessonForm.sort_order}
                          onChange={(e) => setLessonForm({ ...lessonForm, sort_order: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          min="1"
                          placeholder="Auto"
                        />
                        <p className="text-xs text-gray-500 mt-1">Dejar vacío para agregar al final</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL del Video (opcional)
                      </label>
                      <input
                        type="url"
                        value={lessonForm.video_url}
                        onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={creatingLesson}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {creatingLesson ? (
                          <>
                            <LoadingSpinner />
                            {editingLesson ? 'Actualizando...' : 'Creando...'}
                          </>
                        ) : (
                          <>
                            {editingLesson ? (
                              <>
                                <Edit className="w-4 h-4" />
                                Guardar Cambios
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Crear Lección
                              </>
                            )}
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLessonModal(false);
                          setLessonForm({
                            title: '',
                            description: '',
                            content: '',
                            duration_minutes: '',
                            video_url: '',
                            sort_order: ''
                          });
                          setEditingLesson(null);
                          setError(null);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'quizzes' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Quizzes del Curso</h2>
                  <div className="flex items-center gap-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {quizzes.length} quizzes
                    </span>
                    <button
                      onClick={() => router.push(`/dashboard_profesor/quizzes/create?course_id=${courseId}`)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Nuevo Quiz
                    </button>
                  </div>
                </div>
                {quizzes.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No hay quizzes en este curso</h5>
                    <p className="text-gray-600 mb-4">Crea quizzes para evaluar el conocimiento de tus estudiantes.</p>
                    <button
                      onClick={() => router.push(`/dashboard_profesor/quizzes/create?course_id=${courseId}`)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Crear Primer Quiz
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quizzes.map((quiz) => (
                      <div key={quiz.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                          <h6 className="font-semibold text-gray-900">{quiz.title}</h6>
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/dashboard_profesor/quizzes/${quiz.id}`)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Ver Resultados"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard_profesor/quizzes/${quiz.id}/edit`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar Quiz"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="p-5">
                          {quiz.description && (
                            <p className="text-gray-600 text-sm mb-3">{quiz.description}</p>
                          )}
                          <div className="grid grid-cols-3 gap-4 text-center mb-3">
                            <div>
                              <h6 className="font-semibold text-gray-900">{quiz.total_preguntas}</h6>
                              <small className="text-gray-500">Preguntas</small>
                            </div>
                            <div>
                              <h6 className="font-semibold text-gray-900">{quiz.estudiantes_completaron}</h6>
                              <small className="text-gray-500">Completaron</small>
                            </div>
                            <div>
                              <h6 className="font-semibold text-gray-900">{quiz.puntuacion_promedio.toFixed(1)}</h6>
                              <small className="text-gray-500">Promedio</small>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              Puntaje mínimo: {quiz.passing_score}%
                            </span>
                            {quiz.time_limit_minutes && (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                {quiz.time_limit_minutes} min
                              </span>
                            )}
                            {quiz.is_required && (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                Obligatorio
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default function CourseManagementPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    }>
      <CourseManagementContent />
    </Suspense>
  );
}

