'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  BookOpen, 
  Users, 
  FileText, 
  TrendingUp, 
  Clock, 
  ClipboardList,
  UserPlus,
  Activity,
  Settings,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  MessageSquare
} from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  total_estudiantes: number;
  total_lecciones: number;
  progreso_promedio: number;
  created_at: string;
}

interface Stats {
  total_cursos: number;
  total_estudiantes: number;
  total_lecciones: number;
  lecciones_completadas: number;
  progreso_general: number;
  resultados_pendientes: number;
}

interface RecentStudent {
  name: string;
  email: string;
  curso: string;
  started_at: string;
}

interface RecentActivity {
  tipo: 'inscripcion' | 'completado';
  estudiante: string;
  curso: string;
  fecha: string;
}

function ProfesorDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
      const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
      const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 1,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [statsRes, coursesRes, studentsRes, activityRes] = await Promise.all([
        fetch('/api/professor/stats'),
        fetch(`/api/professor/courses?page=${page}&per_page=10`),
        fetch('/api/professor/recent-students?limit=10'),
        fetch('/api/professor/recent-activity?limit=15'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        if (coursesData.success) {
          setCourses(coursesData.data);
          setPagination(coursesData.pagination);
        }
      }

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        if (studentsData.success) {
          setRecentStudents(studentsData.data);
        }
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        if (activityData.success) {
          setRecentActivity(activityData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/dashboard_profesor?page=${newPage}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              Reintentar
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Bienvenido, Profesor</h1>
              <p className="text-green-50 text-lg">Panel de gestión de cursos y estudiantes</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{stats?.total_cursos || 0}</div>
              <div className="text-green-50">Mis Cursos</div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats?.total_cursos || 0}</div>
            <div className="text-sm text-gray-600">Cursos Totales</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats?.total_estudiantes || 0}</div>
            <div className="text-sm text-gray-600">Estudiantes</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats?.total_lecciones || 0}</div>
            <div className="text-sm text-gray-600">Lecciones</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <CheckCircle className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats?.lecciones_completadas || 0}</div>
            <div className="text-sm text-gray-600">Completadas</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <TrendingUp className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats?.progreso_general || 0}%</div>
            <div className="text-sm text-gray-600">Progreso General</div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/dashboard_profesor/courses')}
              className="bg-gray-700 hover:bg-gray-800 text-white p-5 rounded-lg transition-all hover:shadow-lg group border border-gray-600"
            >
              <BookOpen className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-semibold">Mis Cursos</div>
            </button>
            <button
              onClick={() => router.push('/dashboard_profesor/messages')}
              className="bg-gray-700 hover:bg-gray-800 text-white p-5 rounded-lg transition-all hover:shadow-lg group border border-gray-600"
            >
              <MessageSquare className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-semibold">Mensajes</div>
            </button>
            <button
              onClick={() => router.push('/dashboard_profesor/quizzes/pending')}
              className="bg-gray-700 hover:bg-gray-800 text-white p-5 rounded-lg transition-all hover:shadow-lg group border border-gray-600"
            >
              <ClipboardList className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-semibold">Evaluaciones</div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mis Cursos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  <BookOpen className="w-5 h-5 inline mr-2" />
                  Mis Cursos
                </h2>
                <div className="flex items-center gap-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {pagination.total} cursos totales
                  </span>
                  <span className="text-sm text-gray-500">
                    Página {pagination.page} de {pagination.total_pages}
                  </span>
                </div>
              </div>
              <div className="p-6">
                {courses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No tienes cursos asignados</h5>
                    <p className="text-gray-600 mb-2">Los administradores te asignarán cursos cuando estén disponibles.</p>
                    <p className="text-sm text-gray-500">
                      Solo los administradores pueden crear y asignar cursos
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {courses.map((course) => (
                        <div
                          key={course.id}
                          onClick={() => router.push(`/dashboard_profesor/courses/${course.id}`)}
                          className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all border-l-4 border-l-green-500 cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h6 className="font-semibold text-lg text-gray-900 mb-1">{course.title}</h6>
                              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                {course.description?.substring(0, 80)}...
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                {course.total_estudiantes} estudiantes
                              </span>
                              <br />
                              <small className="text-gray-500 text-sm mt-1 block">
                                {course.total_lecciones} lecciones
                              </small>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex-1 mr-4">
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${course.progreso_promedio}%` }}
                                />
                              </div>
                              <small className="text-gray-500 text-sm">
                                Progreso promedio: {course.progreso_promedio}%
                              </small>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => router.push(`/dashboard_profesor/courses/${course.id}`)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Gestionar Curso"
                              >
                                <Settings className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => router.push(`/cursos/${course.id}`)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Ver"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => router.push(`/dashboard_profesor/courses/${course.id}/students`)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Estudiantes"
                              >
                                <Users className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Paginación */}
                    {pagination.total_pages > 1 && (
                      <div className="mt-6">
                        <div className="flex justify-center">
                          <nav className="flex items-center gap-2">
                            <button
                              onClick={() => handlePageChange(page - 1)}
                              disabled={page === 1}
                              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            
                            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                              let pageNum;
                              if (pagination.total_pages <= 5) {
                                pageNum = i + 1;
                              } else if (page <= 3) {
                                pageNum = i + 1;
                              } else if (page >= pagination.total_pages - 2) {
                                pageNum = pagination.total_pages - 4 + i;
                              } else {
                                pageNum = page - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`px-4 py-2 rounded-lg border ${
                                    pageNum === page
                                      ? 'bg-green-600 text-white border-green-600'
                                      : 'border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            
                            <button
                              onClick={() => handlePageChange(page + 1)}
                              disabled={page === pagination.total_pages}
                              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </nav>
                        </div>
                        <div className="text-center mt-3">
                          <small className="text-gray-500">
                            Mostrando {courses.length} de {pagination.total} cursos ({pagination.per_page} por página)
                          </small>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Resultados Pendientes de Calificación */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h6 className="font-semibold text-gray-900">
                  <Clock className="w-5 h-5 inline mr-2 text-yellow-600" />
                  Calificaciones Pendientes
                </h6>
              </div>
              <div className="p-4">
                {stats?.resultados_pendientes === 0 ? (
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No hay calificaciones pendientes</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <h4 className="text-3xl font-bold text-yellow-600 mb-1">{stats?.resultados_pendientes || 0}</h4>
                      <p className="text-sm text-gray-600 mb-3">Resultados pendientes de calificación manual</p>
                      <button
                        onClick={() => router.push('/dashboard_profesor/quizzes/pending')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Revisar Ahora
                      </button>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                      <strong>Recordatorio:</strong> Las preguntas de texto libre y verdadero/falso con justificación requieren calificación manual.
                    </div>
                  </>
                )}
              </div>
            </div>


            {/* Estudiantes Recientes */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h6 className="font-semibold text-gray-900">
                  <UserPlus className="w-5 h-5 inline mr-2 text-blue-500" />
                  Estudiantes Recientes
                </h6>
              </div>
              <div className="p-4">
                {recentStudents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">No hay estudiantes recientes</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {recentStudents.slice(0, 5).map((student, index) => (
                        <div key={index} className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h6 className="font-semibold text-gray-900 text-sm">{student.name}</h6>
                              <p className="text-xs text-gray-600">{student.email}</p>
                              <p className="text-xs text-gray-600 mt-1">{student.curso}</p>
                            </div>
                            <small className="text-gray-500 text-xs">{formatDate(student.started_at)}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                    {recentStudents.length > 5 && (
                      <div className="text-center mt-3">
                        <button
                          onClick={() => router.push('/dashboard_profesor/students')}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Ver todos ({recentStudents.length})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Actividad Reciente */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h6 className="font-semibold text-gray-900">
                  <Activity className="w-5 h-5 inline mr-2 text-green-500" />
                  Actividad Reciente
                </h6>
              </div>
              <div className="p-4">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">No hay actividad reciente</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 8).map((activity, index) => (
                      <div key={index} className="bg-green-50 border-l-4 border-green-400 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          {activity.tipo === 'inscripcion' ? (
                            <UserPlus className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              <strong>{activity.estudiante}</strong>{' '}
                              {activity.tipo === 'inscripcion' ? 'se inscribió en' : 'completó una lección de'}{' '}
                              <strong>{activity.curso}</strong>
                            </p>
                            <small className="text-gray-500 text-xs">{formatDateTime(activity.fecha)}</small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ProfesorDashboard() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    }>
      <ProfesorDashboardContent />
    </Suspense>
  );
}
