'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Circle,
  ArrowLeft,
  ArrowRight,
  Download,
  Eye,
  PlayCircle,
  FileText,
  Check
} from 'lucide-react';

interface LessonResource {
  id: number;
  title: string;
  description?: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  is_downloadable?: boolean;
  sort_order: number;
}

interface LessonProgress {
  completed: boolean;
  completed_at?: string;
  time_watched?: number;
  started_at?: string;
}

interface Lesson {
  id: number;
  title: string;
  description?: string;
  content?: string;
  video_url?: string;
  duration_minutes?: number;
  sort_order: number;
  course_id: number;
  course_title: string;
  course_progress: number;
  course_completed: boolean;
  progress: LessonProgress | null;
}

interface LessonListItem {
  id: number;
  title: string;
  sort_order: number;
  completed: boolean;
}

interface LessonData {
  lesson: Lesson;
  resources: LessonResource[];
  allLessons: LessonListItem[];
  previousLesson: LessonListItem | null;
  nextLesson: LessonListItem | null;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LessonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchLessonData();
  }, [courseId, lessonId]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/courses/${courseId}/lessons/${lessonId}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('No tienes acceso a esta lección');
        } else if (response.status === 404) {
          setError('Lección no encontrada');
        } else {
          setError('Error al cargar la lección');
        }
        return;
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError('Error al cargar la lección');
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
      setError('Error al cargar la lección');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      setMarkingComplete(true);
      const response = await fetch(`/api/student/courses/${courseId}/lessons/${lessonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_completed: true })
      });

      const result = await response.json();
      if (result.success) {
        setSuccessMessage('¡Lección marcada como completada!');
        // Recargar datos
        await fetchLessonData();
      } else {
        setError(result.error || 'Error al marcar la lección como completada');
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      setError('Error al marcar la lección como completada');
    } finally {
      setMarkingComplete(false);
    }
  };

  const getVideoEmbedUrl = (url: string): string => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return url;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('es-PY');
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
              onClick={() => router.push(`/dashboard_estudiante/courses/${courseId}`)}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              Volver al Curso
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { lesson, resources, allLessons, previousLesson, nextLesson } = data;
  const isCompleted = lesson.progress?.completed || false;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard_estudiante/courses/${courseId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
            <p className="text-gray-600 mt-1">Curso: {lesson.course_title}</p>
          </div>
          <div>
            {isCompleted ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Completada
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
                <Clock className="w-5 h-5" />
                En Progreso
              </span>
            )}
          </div>
        </div>

        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descripción */}
            {lesson.description && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{lesson.description}</p>
              </div>
            )}

            {/* Video */}
            {lesson.video_url && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Video de la Lección</h2>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={getVideoEmbedUrl(lesson.video_url)}
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Contenido */}
            {lesson.content && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Contenido</h2>
                <div 
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              </div>
            )}

            {/* Información de la lección */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Duración</div>
                    <div className="font-semibold text-gray-900">
                      {lesson.duration_minutes ? `${lesson.duration_minutes} min` : 'No especificada'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Recursos</div>
                    <div className="font-semibold text-gray-900">{resources.length}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Orden</div>
                    <div className="font-semibold text-gray-900">{lesson.sort_order}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recursos */}
            {resources.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recursos de la Lección</h2>
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Download className="w-5 h-5 text-blue-600 mt-1" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{resource.title}</h3>
                            {resource.description && (
                              <p className="text-gray-600 text-sm mb-2">{resource.description}</p>
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
                        {resource.file_url && (
                          <div className="flex gap-2">
                            <a
                              href={`/api/resources/download?id=${resource.id}&type=lesson`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Descargar
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón de Completar */}
            {!isCompleted ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-center">
                  <button
                    onClick={handleMarkComplete}
                    disabled={markingComplete}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {markingComplete ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Marcar como Completada
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Lección Completada
                  </div>
                  {lesson.progress?.completed_at && (
                    <p className="text-gray-600 text-sm mt-2">
                      Completada el {formatDate(lesson.progress.completed_at)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lista de Lecciones */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Lecciones del Curso</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allLessons.map((l) => {
                  const isActive = l.id === parseInt(lessonId);
                  const isCompleted = l.completed;
                  
                  return (
                    <div
                      key={l.id}
                      onClick={() => router.push(`/dashboard_estudiante/courses/${courseId}/lessons/${l.id}`)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        isActive
                          ? 'bg-blue-50 border-l-4 border-blue-600'
                          : isCompleted
                          ? 'bg-green-50 border-l-4 border-green-500 hover:bg-green-100'
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          ) : isActive ? (
                            <PlayCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                          )}
                          <span className={`text-sm truncate ${
                            isActive ? 'font-semibold text-blue-600' : 'text-gray-700'
                          }`}>
                            {l.title}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                          {l.sort_order}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navegación */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Navegación</h3>
              <div className="space-y-3">
                {previousLesson ? (
                  <button
                    onClick={() => router.push(`/dashboard_estudiante/courses/${courseId}/lessons/${previousLesson.id}`)}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Lección Anterior
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 text-gray-400 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Lección Anterior
                  </button>
                )}
                
                {nextLesson ? (
                  <button
                    onClick={() => router.push(`/dashboard_estudiante/courses/${courseId}/lessons/${nextLesson.id}`)}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    Lección Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 text-gray-400 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Lección Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Progreso del Curso */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Progreso del Curso</h3>
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${lesson.course_progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  {lesson.course_progress}% completado
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

