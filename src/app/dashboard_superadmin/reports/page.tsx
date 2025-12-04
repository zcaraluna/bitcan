'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  BarChart, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Award,
  Download,
  Calendar,
  RefreshCw,
  FileText,
  Activity
} from 'lucide-react';

interface GeneralStats {
  total_usuarios: number;
  total_estudiantes: number;
  total_profesores: number;
  total_superadmins: number;
  total_cursos: number;
  total_lecciones: number;
  total_inscripciones: number;
  lecciones_completadas: number;
  certificados_emitidos: number;
}

interface PopularCourse {
  id: number;
  title: string;
  estudiantes: number;
  completados: number;
  instructor_name: string;
}

interface RecentActivity {
  id: number;
  tipo: string;
  usuario: string;
  curso: string;
  fecha: string;
  details: string;
}

interface MonthlyData {
  mes: string;
  inscripciones: number;
  completados: number;
}

interface CourseRating {
  id: number;
  title: string;
  total_ratings: number;
  avg_professor_rating: string | null;
  avg_platform_rating: string | null;
  avg_course_rating: string | null;
  instructor_name: string | null;
}

export default function SystemReports() {
  const [stats, setStats] = useState<GeneralStats>({
    total_usuarios: 0,
    total_estudiantes: 0,
    total_profesores: 0,
    total_superadmins: 0,
    total_cursos: 0,
    total_lecciones: 0,
    total_inscripciones: 0,
    lecciones_completadas: 0,
    certificados_emitidos: 0
  });
  const [popularCourses, setPopularCourses] = useState<PopularCourse[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [courseRatings, setCourseRatings] = useState<CourseRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30'); // días
  const router = useRouter();

  useEffect(() => {
    loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [statsResponse, coursesResponse, activityResponse, monthlyResponse, ratingsResponse] = await Promise.all([
        fetch('/api/admin/reports/stats'),
        fetch('/api/admin/reports/popular-courses'),
        fetch(`/api/admin/reports/recent-activity?days=${dateRange}`),
        fetch('/api/admin/reports/monthly-data'),
        fetch('/api/admin/reports/course-ratings')
      ]);

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data.stats);
      }

      if (coursesResponse.ok) {
        const data = await coursesResponse.json();
        setPopularCourses(data.courses);
      }

      if (activityResponse.ok) {
        const data = await activityResponse.json();
        setRecentActivity(data.activity);
      }

      if (monthlyResponse.ok) {
        const data = await monthlyResponse.json();
        setMonthlyData(data.monthlyData);
      }

      if (ratingsResponse.ok) {
        const data = await ratingsResponse.json();
        setCourseRatings(data.ratings || []);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      setError('Error al cargar datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/admin/reports/export?format=csv');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_bitcan_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Error al exportar datos');
    }
  };

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'inscripcion': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'completado': return <Award className="w-4 h-4 text-green-600" />;
      case 'certificado': return <FileText className="w-4 h-4 text-purple-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (tipo: string) => {
    switch (tipo) {
      case 'inscripcion': return 'bg-blue-50 border-blue-200';
      case 'completado': return 'bg-green-50 border-green-200';
      case 'certificado': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
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

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart className="w-8 h-8 text-gray-600" />
                Reportes del Sistema
              </h1>
              <p className="text-gray-600 mt-1">Estadísticas y análisis del sistema BITCAN</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadReportData}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
              <button
                onClick={exportToCSV}
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Estadísticas Generales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
            <Users className="w-8 h-8 mb-3 text-gray-600" />
            <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats.total_usuarios}</h4>
            <p className="text-gray-600 text-sm">Total Usuarios</p>
            <div className="mt-2 text-xs text-gray-500">
              <div>Estudiantes: {stats.total_estudiantes}</div>
              <div>Profesores: {stats.total_profesores}</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
            <BookOpen className="w-8 h-8 mb-3 text-gray-600" />
            <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats.total_cursos}</h4>
            <p className="text-gray-600 text-sm">Cursos Activos</p>
            <div className="mt-2 text-xs text-gray-500">
              <div>Lecciones: {stats.total_lecciones}</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
            <TrendingUp className="w-8 h-8 mb-3 text-gray-600" />
            <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats.total_inscripciones}</h4>
            <p className="text-gray-600 text-sm">Inscripciones</p>
            <div className="mt-2 text-xs text-gray-500">
              <div>Completadas: {stats.lecciones_completadas}</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
            <Award className="w-8 h-8 mb-3 text-gray-600" />
            <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats.certificados_emitidos}</h4>
            <p className="text-gray-600 text-sm">Certificados</p>
            <div className="mt-2 text-xs text-gray-500">
              <div>Emitidos</div>
            </div>
          </div>
        </div>

        {/* Cursos Más Populares */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-gray-600" />
              Cursos Más Populares
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posición</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiantes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completados</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {popularCourses.map((course, index) => {
                  const completionRate = course.estudiantes > 0 
                    ? ((course.completados / course.estudiantes) * 100).toFixed(1) 
                    : '0.0';
                  
                  return (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-bold text-gray-700">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{course.title}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{course.instructor_name || 'Sin asignar'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {course.estudiantes}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {course.completados}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{completionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-gray-600" />
              Actividad Reciente
            </h2>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
            </select>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className={`p-3 rounded-lg border ${getActivityColor(activity.tipo)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getActivityIcon(activity.tipo)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 capitalize">{activity.tipo}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.fecha).toLocaleString('es-PY')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">{activity.usuario}</span> - {activity.curso}
                      </div>
                      {activity.details && (
                        <div className="text-xs text-gray-500 mt-1">{activity.details}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                No hay actividad reciente en el período seleccionado
              </div>
            )}
          </div>
        </div>

        {/* Datos Mensuales */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-gray-600" />
            Tendencias Mensuales
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthlyData.map((month) => (
              <div key={month.mes} className="bg-gray-50 rounded-lg p-4">
                <div className="font-medium text-gray-900 mb-2">{month.mes}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Inscripciones:</span>
                    <span className="font-bold text-blue-600">{month.inscripciones}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completados:</span>
                    <span className="font-bold text-green-600">{month.completados}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calificaciones de Cursos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-gray-600" />
              Calificaciones y Feedback de Cursos
            </h2>
          </div>
          
          {courseRatings.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No hay calificaciones disponibles aún
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Calificaciones</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profesor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plataforma</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {courseRatings.map((rating) => (
                    <tr key={rating.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{rating.title}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {rating.instructor_name || 'Sin asignar'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {rating.total_ratings}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {rating.avg_professor_rating ? (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="font-semibold text-gray-900">{rating.avg_professor_rating}</span>
                            <span className="text-gray-400 text-xs">/ 5.0</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {rating.avg_platform_rating ? (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="font-semibold text-gray-900">{rating.avg_platform_rating}</span>
                            <span className="text-gray-400 text-xs">/ 5.0</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {rating.avg_course_rating ? (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="font-semibold text-gray-900">{rating.avg_course_rating}</span>
                            <span className="text-gray-400 text-xs">/ 5.0</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumen de Usuarios por Rol */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-gray-600" />
            Distribución de Usuarios
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-800 font-medium">Estudiantes</span>
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-900">{stats.total_estudiantes}</div>
              <div className="text-sm text-green-700 mt-1">
                {stats.total_usuarios > 0 ? ((stats.total_estudiantes / stats.total_usuarios) * 100).toFixed(1) : 0}% del total
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-800 font-medium">Profesores</span>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-900">{stats.total_profesores}</div>
              <div className="text-sm text-blue-700 mt-1">
                {stats.total_usuarios > 0 ? ((stats.total_profesores / stats.total_usuarios) * 100).toFixed(1) : 0}% del total
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-800 font-medium">SuperAdmins</span>
                <Users className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-900">{stats.total_superadmins}</div>
              <div className="text-sm text-red-700 mt-1">
                {stats.total_usuarios > 0 ? ((stats.total_superadmins / stats.total_usuarios) * 100).toFixed(1) : 0}% del total
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
