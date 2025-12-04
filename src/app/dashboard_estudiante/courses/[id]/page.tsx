'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Circle,
  PlayCircle,
  FileText,
  ArrowLeft,
  Download,
  ExternalLink,
  Eye
} from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  description: string;
  content: string;
  video_url?: string;
  duration_minutes?: number;
  order_index: number;
  completed: boolean;
  completed_at?: string;
  last_accessed?: string;
  progress?: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  instructions: string;
  time_limit_minutes?: number;
  passing_score?: number;
  start_datetime?: string;
  end_datetime?: string;
  results_publish_datetime?: string;
  order_index: number;
  result_id?: number;
  score?: number;
  max_score?: number;
  passed?: boolean;
  completed_at?: string;
  attempts?: number;
}

interface Resource {
  id: number;
  title: string;
  description?: string;
  file_path?: string;
  url?: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
  created_by_name?: string;
}

interface CourseData {
  course: {
    id: number;
    title: string;
    description: string;
    short_description?: string;
    identifier?: string;
    duration_hours?: number;
    duration_minutes?: number;
    thumbnail_url?: string;
    level?: string;
    video_url?: string;
    requirements?: string;
    learning_objectives?: string;
    instructor?: string;
    students_count: number;
    started_at: string;
    completed_at?: string;
    progress: number;
    course_completed: boolean;
    has_certificate: number;
  };
  lessons: Lesson[];
  quizzes: Quiz[];
  resources: Resource[];
  stats: {
    total_lessons: number;
    completed_lessons: number;
    total_quizzes: number;
    completed_quizzes: number;
    progress: number;
    course_completed: boolean;
  };
}

type QuizStatus = 'available' | 'completed' | 'completed_waiting' | 'not_started' | 'ended';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CourseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'lessons' | 'quizzes' | 'resources'>('lessons');
  const [messageShown, setMessageShown] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  // Mostrar mensaje de la URL si existe
  useEffect(() => {
    if (messageShown) return; // Evitar mostrar el mensaje múltiples veces
    
    // Leer el mensaje directamente de la URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const message = urlParams.get('message');
      
      if (message) {
        try {
          // Decodificar el mensaje de la URL
          const decodedMessage = decodeURIComponent(message);
          toast.success('Quiz Completado', decodedMessage);
          setMessageShown(true);
          
          // Limpiar la URL sin recargar la página
          router.replace(`/dashboard_estudiante/courses/${courseId}`, { scroll: false });
        } catch (error) {
          console.error('Error decoding message:', error);
          toast.success('Quiz Completado', message);
          setMessageShown(true);
          router.replace(`/dashboard_estudiante/courses/${courseId}`, { scroll: false });
        }
      }
    }
  }, [toast, router, courseId, messageShown]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/courses/${courseId}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('No estás inscrito en este curso');
        } else if (response.status === 404) {
          setError('Curso no encontrado');
        } else {
          setError('Error al cargar el curso');
        }
        return;
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
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

  const handleLessonClick = (lessonId: number) => {
    router.push(`/dashboard_estudiante/courses/${courseId}/lessons/${lessonId}`);
  };

  const handleQuizClick = (quizId: number) => {
    router.push(`/dashboard_estudiante/courses/${courseId}/quizzes/${quizId}`);
  };

  const getQuizStatus = (quiz: Quiz): { status: QuizStatus; message: string; class: string; text: string; icon: string } => {
    const now = new Date();
    
    if (quiz.completed_at) {
      if (quiz.results_publish_datetime) {
        const publishDate = new Date(quiz.results_publish_datetime);
        if (now < publishDate) {
          return {
            status: 'completed_waiting',
            message: `Resultados disponibles: ${publishDate.toLocaleString('es-PY')}`,
            class: 'bg-yellow-100 text-yellow-800',
            text: 'Completado',
            icon: 'clock'
          };
        }
      }
      return {
        status: 'completed',
        message: '',
        class: quiz.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
        text: quiz.passed ? 'Aprobado' : 'No Aprobado',
        icon: quiz.passed ? 'check' : 'x'
      };
    }
    
    if (quiz.start_datetime) {
      const startDate = new Date(quiz.start_datetime);
      if (now < startDate) {
        return {
          status: 'not_started',
          message: `Inicia: ${startDate.toLocaleString('es-PY')}`,
          class: 'bg-gray-100 text-gray-800',
          text: 'No Disponible',
          icon: 'clock'
        };
      }
    }
    
    if (quiz.end_datetime) {
      const endDate = new Date(quiz.end_datetime);
      if (now > endDate) {
        return {
          status: 'ended',
          message: `Terminó: ${endDate.toLocaleString('es-PY')}`,
          class: 'bg-red-100 text-red-800',
          text: 'Finalizado',
          icon: 'x'
        };
      }
    }
    
    return {
      status: 'available',
      message: '',
      class: 'bg-blue-600 hover:bg-blue-700 text-white',
      text: 'Tomar Quiz',
      icon: 'play'
    };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PY');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    return `${(bytes / 1024).toFixed(2)} KB`;
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

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Error desconocido'}</p>
            <button
              onClick={() => router.push('/dashboard_estudiante/courses')}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              Volver a Mis Cursos
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { course, lessons, quizzes, resources, stats } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header con botón de volver */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard_estudiante/courses')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            {course.instructor && (
              <p className="text-gray-600 mt-1">Por {course.instructor}</p>
            )}
          </div>
        </div>

        {/* Imagen del curso */}
        {course.thumbnail_url && (
          <div className="relative h-64 rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={course.thumbnail_url} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Estadísticas y progreso */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stats.progress}%</div>
              <div className="text-sm text-gray-600 mt-1">Progreso</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {stats.completed_lessons}/{stats.total_lessons}
              </div>
              <div className="text-sm text-gray-600 mt-1">Lecciones</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {stats.completed_quizzes}/{stats.total_quizzes}
              </div>
              <div className="text-sm text-gray-600 mt-1">Quizzes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {course.students_count}
              </div>
              <div className="text-sm text-gray-600 mt-1">Estudiantes</div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, stats.progress)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Descripción del curso */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción del Curso</h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{course.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Duración</div>
                <div className="font-semibold text-gray-900">
                  {course.duration_hours ? `${course.duration_hours} horas` : 'No especificada'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PlayCircle className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Lecciones</div>
                <div className="font-semibold text-gray-900">{stats.total_lessons}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Quizzes</div>
                <div className="font-semibold text-gray-900">{stats.total_quizzes}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('lessons')}
                className={`px-6 py-4 font-medium transition-all ${
                  activeTab === 'lessons'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Lecciones
              </button>
              <button
                onClick={() => setActiveTab('quizzes')}
                className={`px-6 py-4 font-medium transition-all ${
                  activeTab === 'quizzes'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Quizzes
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-6 py-4 font-medium transition-all ${
                  activeTab === 'resources'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Recursos
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Tab de Lecciones */}
            {activeTab === 'lessons' && (
              <div className="space-y-4">
                {lessons.length > 0 ? (
                  lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson.id)}
                      className="group border border-gray-200 rounded-xl p-5 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer bg-white"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {lesson.completed ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-300 group-hover:text-blue-500 transition-colors" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {lesson.title}
                              </h3>
                              {lesson.description && (
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                  {lesson.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                {lesson.duration_minutes && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{lesson.duration_minutes} min</span>
                                  </div>
                                )}
                                {lesson.completed && lesson.completed_at && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Completada el {formatDate(lesson.completed_at)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {lesson.video_url && (
                                <PlayCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <PlayCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No hay lecciones disponibles</h5>
                    <p className="text-gray-500">Las lecciones aparecerán aquí cuando estén disponibles.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab de Quizzes */}
            {activeTab === 'quizzes' && (
              <div className="space-y-4">
                {quizzes.length > 0 ? (
                  quizzes.map((quiz) => {
                    const quizStatus = getQuizStatus(quiz);
                    return (
                      <div
                        key={quiz.id}
                        className="group border border-gray-200 rounded-xl p-5 hover:border-blue-500 hover:shadow-lg transition-all bg-white"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                                  {quiz.title}
                                </h3>
                                {quiz.description && (
                                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                    {quiz.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                  <span>Puntaje mínimo: {quiz.passing_score}%</span>
                                  {quiz.time_limit_minutes && (
                                    <span>Tiempo límite: {quiz.time_limit_minutes} min</span>
                                  )}
                                  {quiz.start_datetime && (
                                    <span>Inicia: {new Date(quiz.start_datetime).toLocaleString('es-PY')}</span>
                                  )}
                                  {quiz.end_datetime && (
                                    <span>Termina: {new Date(quiz.end_datetime).toLocaleString('es-PY')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div>
                                {quizStatus.status === 'completed_waiting' && (
                                  <div>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${quizStatus.class}`}>
                                      {quizStatus.text}
                                    </span>
                                    {quizStatus.message && (
                                      <p className="text-xs text-gray-500 mt-1">{quizStatus.message}</p>
                                    )}
                                  </div>
                                )}
                                {quizStatus.status === 'completed' && (
                                  <div>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-1 ${quizStatus.class}`}>
                                      {quizStatus.text}
                                    </span>
                                    <p className="text-sm text-gray-600">
                                      Puntaje: {quiz.score}/{quiz.max_score}
                                    </p>
                                  </div>
                                )}
                                {(quizStatus.status === 'not_started' || quizStatus.status === 'ended') && (
                                  <div>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${quizStatus.class}`}>
                                      {quizStatus.text}
                                    </span>
                                    {quizStatus.message && (
                                      <p className="text-xs text-gray-500 mt-1">{quizStatus.message}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div>
                                {quizStatus.status === 'completed' && (
                                  <button
                                    onClick={() => router.push(`/dashboard_estudiante/courses/${courseId}/quizzes/${quiz.id}/result`)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                  >
                                    <Eye className="w-4 h-4 inline mr-1" />
                                    Ver Resultados
                                  </button>
                                )}
                                {quizStatus.status === 'available' && (
                                  <button
                                    onClick={() => handleQuizClick(quiz.id)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                  >
                                    {quizStatus.text}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No hay quizzes disponibles</h5>
                    <p className="text-gray-500">Los quizzes aparecerán aquí cuando estén disponibles.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab de Recursos */}
            {activeTab === 'resources' && (
              <div className="space-y-4">
                {resources.length > 0 ? (
                  resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="group border border-gray-200 rounded-xl p-5 hover:border-blue-500 hover:shadow-lg transition-all bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <Download className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-gray-900 mb-2">
                              {resource.title}
                            </h3>
                            {resource.description && (
                              <p className="text-gray-600 text-sm mb-3">
                                {resource.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              {resource.file_type && (
                                <span>Tipo: {resource.file_type.toUpperCase()}</span>
                              )}
                              {resource.file_size && (
                                <span>Tamaño: {formatFileSize(resource.file_size)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {resource.file_path ? (
                            <a
                              href={`/api/resources/download?id=${resource.id}&type=course`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Descargar
                            </a>
                          ) : resource.url ? (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Ver Enlace
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No hay recursos disponibles</h5>
                    <p className="text-gray-500">Los recursos del curso aparecerán aquí cuando estén disponibles.</p>
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
