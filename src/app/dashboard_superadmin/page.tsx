'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Users, GraduationCap, BookOpen, FileText, TrendingUp, Settings, Bell, MessageSquare, Ticket, Award } from 'lucide-react';

interface SystemStats {
  total_usuarios: number;
  total_estudiantes: number;
  total_profesores: number;
  total_superadmins: number;
  total_cursos: number;
  total_lecciones: number;
  total_inscripciones: number;
  lecciones_completadas: number;
  perfiles_completados: number;
  perfiles_pendientes: number;
}

interface RecentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  profile_completed: boolean;
}

interface PopularCourse {
  id: number;
  title: string;
  description: string;
  total_estudiantes: number;
  progreso_promedio: number;
}

interface SystemActivity {
  usuario: string;
  curso: string;
  fecha: string;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [popularCourses, setPopularCourses] = useState<PopularCourse[]>([]);
  const [systemActivity, setSystemActivity] = useState<SystemActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      const usersResponse = await fetch('/api/admin/recent-users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setRecentUsers(usersData.users);
      }

      const coursesResponse = await fetch('/api/admin/popular-courses');
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setPopularCourses(coursesData.courses);
      }

      const activityResponse = await fetch('/api/admin/system-activity');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setSystemActivity(activityData.activity);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const adminActions = [
    { label: 'Gestionar Cursos', color: 'blue', icon: BookOpen, route: '/dashboard_superadmin/courses' },
    { label: 'Gestionar Usuarios', color: 'green', icon: Users, route: '/dashboard_superadmin/users' },
    { label: 'Certificados', color: 'cyan', icon: Award, route: '/dashboard_superadmin/v2/certificates' },
    { label: 'Gestionar Roles', color: 'purple', icon: Settings, route: '/dashboard_superadmin/roles' },
    { label: 'Configuración', color: 'gray', icon: Settings, route: '/dashboard_superadmin/config' },
    { label: 'Reportes', color: 'indigo', icon: FileText, route: '/dashboard_superadmin/reports' },
    { label: 'Notificaciones', color: 'yellow', icon: Bell, route: '/dashboard_superadmin/notifications' },
    { label: 'Mensajes', color: 'pink', icon: MessageSquare, route: '/dashboard_superadmin/messages' },
    { label: 'Cupones', color: 'orange', icon: Ticket, route: '/dashboard_superadmin/coupons' },
  ];

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Panel de SuperAdministración</h1>
                <p className="text-red-50 text-lg">Gestión completa del sistema BITCAN</p>
              </div>
              <div className="flex gap-8">
                <div className="text-center bg-white/10 rounded-lg px-6 py-3">
                  <div className="text-4xl font-bold">{stats?.total_usuarios || 0}</div>
                  <div className="text-sm text-red-50">Usuarios</div>
                </div>
                <div className="text-center bg-white/10 rounded-lg px-6 py-3">
                  <div className="text-4xl font-bold">{stats?.total_cursos || 0}</div>
                  <div className="text-sm text-red-50">Cursos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas Globales */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <Users className="w-8 h-8 mb-3 text-gray-600" />
              <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats?.total_usuarios || 0}</h4>
              <p className="text-gray-600 text-sm">Total Usuarios</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <GraduationCap className="w-8 h-8 mb-3 text-gray-600" />
              <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats?.total_estudiantes || 0}</h4>
              <p className="text-gray-600 text-sm">Estudiantes</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <Users className="w-8 h-8 mb-3 text-gray-600" />
              <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats?.total_profesores || 0}</h4>
              <p className="text-gray-600 text-sm">Profesores</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <BookOpen className="w-8 h-8 mb-3 text-gray-600" />
              <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats?.total_cursos || 0}</h4>
              <p className="text-gray-600 text-sm">Cursos</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <FileText className="w-8 h-8 mb-3 text-gray-600" />
              <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats?.total_lecciones || 0}</h4>
              <p className="text-gray-600 text-sm">Lecciones</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <TrendingUp className="w-8 h-8 mb-3 text-gray-600" />
              <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats?.total_inscripciones || 0}</h4>
              <p className="text-gray-600 text-sm">Inscripciones</p>
            </div>
          </div>

          {/* Acciones de Administración */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Administración del Sistema</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {adminActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.route}
                    onClick={() => router.push(action.route)}
                    className="bg-gray-700 hover:bg-gray-800 text-white p-5 rounded-lg transition-all hover:shadow-lg text-center group border border-gray-600"
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-semibold">{action.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cursos Más Populares */}
            <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Cursos Más Populares</h3>
              <div className="space-y-3">
                {popularCourses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay cursos disponibles</p>
                ) : (
                  popularCourses.map((course) => (
                    <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-blue-300">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{course.title}</h4>
                        <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                          {course.total_estudiantes} estudiantes
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {course.description.substring(0, 60)}...
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Progreso: {Math.round(course.progreso_promedio || 0)}%
                        </span>
                        <button
                          onClick={() => router.push(`/cursos/${course.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-semibold hover:underline"
                        >
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Usuarios Recientes */}
            <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Usuarios Recientes</h3>
              <div className="space-y-3">
                {recentUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay usuarios recientes</p>
                ) : (
                  recentUsers.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-green-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{user.name}</h4>
                            <p className="text-gray-600 text-sm">{user.email}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          user.role === 'superadmin' ? 'bg-red-100 text-red-800' :
                          user.role === 'profesor' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.profile_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.profile_completed ? 'Perfil Completo' : 'Perfil Pendiente'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('es-PY')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Actividad del Sistema */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Actividad Reciente del Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-8 col-span-2">No hay actividad reciente</p>
              ) : (
                systemActivity.map((activity, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">
                          <span className="font-semibold">{activity.usuario}</span> se inscribió en{' '}
                          <span className="font-semibold">{activity.curso}</span>
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(activity.fecha).toLocaleString('es-PY')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Estadísticas Adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats?.lecciones_completadas || 0}</h4>
              <p className="text-gray-600">Lecciones Completadas</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats?.perfiles_completados || 0}</h4>
              <p className="text-gray-600">Perfiles Completados</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <h4 className="text-3xl font-bold text-gray-900 mb-1">{stats?.perfiles_pendientes || 0}</h4>
              <p className="text-gray-600">Perfiles Pendientes</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

