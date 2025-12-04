'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  BookOpen, 
  Clock, 
  ArrowLeft,
  Download,
  FileText
} from 'lucide-react';

interface LessonResource {
  id: number;
  title: string;
  description?: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  sort_order: number;
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
}

interface LessonData {
  lesson: Lesson;
  resources: LessonResource[];
}

export default function ProfessorLessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
  const lessonId = Array.isArray(params.lessonId) ? params.lessonId[0] : params.lessonId;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LessonData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId && lessonId) {
      fetchLessonData();
    }
  }, [courseId, lessonId]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/professor/courses/${courseId}/lessons/${lessonId}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('No tienes permisos para acceder a esta lección');
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        <div className="max-w-4xl mx-auto py-8 px-4">
          <button
            onClick={() => router.push(`/dashboard_profesor/courses/${courseId}?tab=lessons`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al curso</span>
          </button>
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Lección no encontrada'}</h2>
            <p className="text-gray-600">No se pudo cargar la información de la lección.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { lesson, resources } = data;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard_profesor/courses/${courseId}?tab=lessons`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al curso</span>
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
              <p className="text-gray-600">{lesson.course_title}</p>
            </div>
            {lesson.duration_minutes && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span>{lesson.duration_minutes} minutos</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {lesson.description && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-gray-700">{lesson.description}</p>
          </div>
        )}

        {/* Video */}
        {lesson.video_url && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Video</h2>
            <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video">
              <iframe
                src={lesson.video_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Content */}
        {lesson.content && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contenido</h2>
            <div 
              className="prose max-w-none bg-white rounded-lg border border-gray-200 p-6"
              dangerouslySetInnerHTML={{ __html: lesson.content }}
            />
          </div>
        )}

        {/* Resources */}
        {resources.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recursos
            </h2>
            <div className="space-y-3">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{resource.title}</h3>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {resource.file_type && (
                          <span>{resource.file_type}</span>
                        )}
                        {resource.file_size && (
                          <span>{formatFileSize(resource.file_size)}</span>
                        )}
                      </div>
                    </div>
                    {resource.file_url && (
                      <a
                        href={`/api/resources/download?id=${resource.id}&type=lesson`}
                        download
                        className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Descargar"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!lesson.content && !lesson.video_url && resources.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Esta lección aún no tiene contenido.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

