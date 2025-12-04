'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, 
  BookOpen, CheckCircle, Clock, Award, BarChart3 
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Student {
  id: number;
  name: string;
  email: string;
  created_at: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  enrollment: {
    started_at: string;
    completed_at?: string;
    progress: number;
    course_completed: boolean;
  };
}

interface Course {
  id: number;
  title: string;
  description?: string;
}

interface Lesson {
  id: number;
  title: string;
  description?: string;
  duration_minutes: number;
  sort_order: number;
  completed?: boolean;
  completed_at?: string;
}

interface QuizResult {
  id: number;
  title: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
  time_taken_minutes?: number;
  attempts: number;
}

interface Stats {
  lecciones_completadas: number;
  total_lecciones: number;
  quizzes_completados: number;
  total_quizzes: number;
  promedio_quizzes: number;
}

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!courseId || !userId) return;
    fetchStudentDetails();
  }, [courseId, userId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/professor/courses/${courseId}/students/${userId}`);
      const data = await response.json();

      if (data.success) {
        setStudent(data.data.student);
        setCourse(data.data.course);
        setAllLessons(data.data.allLessons || []);
        setQuizResults(data.data.quizResults || []);
        setStats(data.data.stats);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-PY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('es-PY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!student || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Estudiante no encontrado</h2>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = student.enrollment.progress || 0;
  const lessonsProgress = stats ? (stats.lecciones_completadas / stats.total_lecciones) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard_profesor/courses/${courseId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al curso</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Detalles del Estudiante</h1>
          <p className="text-gray-600 mt-1">{course.title}</p>
        </div>

        {/* Student Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                  {student.nombres && student.apellidos && (
                    <p className="text-gray-600">{student.nombres} {student.apellidos}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{student.email}</span>
                </div>
                {student.telefono && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{student.telefono}</span>
                  </div>
                )}
                {(student.direccion || student.ciudad || student.pais) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {[student.direccion, student.ciudad, student.pais].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Miembro desde: {formatDate(student.created_at)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso del Curso</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progreso General</span>
                    <span className="text-sm font-bold text-gray-900">{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Lecciones</span>
                    <span className="text-sm font-bold text-gray-900">
                      {stats?.lecciones_completadas || 0} / {stats?.total_lecciones || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{ width: `${lessonsProgress}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.quizzes_completados || 0}
                    </div>
                    <div className="text-xs text-gray-600">Quizzes Completados</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats?.promedio_quizzes && typeof stats.promedio_quizzes === 'number' 
                        ? stats.promedio_quizzes.toFixed(1) 
                        : '0.0'}%
                    </div>
                    <div className="text-xs text-gray-600">Promedio Quizzes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lessons Progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Progreso de Lecciones
          </h3>
          <div className="space-y-3">
            {allLessons.map((lesson) => (
              <div
                key={lesson.id}
                className={`p-4 rounded-lg border-2 ${
                  lesson.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {lesson.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                      <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                    </div>
                    {lesson.description && (
                      <p className="text-sm text-gray-600 ml-7">{lesson.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 ml-7">
                      <span className="text-xs text-gray-500">
                        {lesson.duration_minutes} minutos
                      </span>
                      {lesson.completed_at && (
                        <span className="text-xs text-gray-500">
                          Completada: {formatDate(lesson.completed_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {lesson.completed ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        Completada
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quiz Results */}
        {quizResults.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Resultados de Quizzes
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Quiz</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Puntaje</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Porcentaje</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Intentos</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quizResults.map((result, index) => (
                    <tr key={result.id || `quiz-result-${index}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{result.title || 'Quiz sin título'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">
                          {typeof result.score === 'number' ? result.score.toFixed(1) : (result.score ? parseFloat(String(result.score)).toFixed(1) : '0.0')} / {typeof result.max_score === 'number' ? result.max_score : (result.max_score || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${
                          (typeof result.percentage === 'number' ? result.percentage : parseFloat(String(result.percentage || 0))) >= 70 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {typeof result.percentage === 'number' ? result.percentage.toFixed(1) : (result.percentage ? parseFloat(String(result.percentage)).toFixed(1) : '0.0')}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {result.passed ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            Aprobado
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                            No Aprobado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{result.attempts || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDateTime(result.completed_at)}
                      </td>
                      <td className="px-4 py-3">
                        {result.id && (
                          <button
                            onClick={() => router.push(`/dashboard_profesor/quizzes/${result.id}/students/${userId}`)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Ver Detalles
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Enrollment Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Información de Inscripción
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Fecha de Inicio</div>
              <div className="font-semibold text-gray-900">{formatDate(student.enrollment.started_at)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Fecha de Finalización</div>
              <div className="font-semibold text-gray-900">
                {student.enrollment.completed_at ? formatDate(student.enrollment.completed_at) : 'En progreso'}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Estado</div>
              <div>
                {student.enrollment.course_completed ? (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Completado
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    En Progreso
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

