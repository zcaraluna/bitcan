'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatsCard from '@/components/StatsCard';
import CourseCard from '@/components/CourseCard';
import { BookOpen, Award, Clock, TrendingUp, MessageSquare, FileText } from 'lucide-react';

interface StudentStats {
  totalCursos: number;
  completados: number;
  enProgreso: number;
  certificados: number;
  progresoPromedio: number;
  leccionesCompletadas: number;
  quizzesCompletados: number;
}

interface StudentCourse {
  id: number;
  title: string;
  description: string;
  short_description?: string;
  duration_hours?: number;
  duration_minutes?: number;
  instructor?: string;
  students_count: number;
  image_url?: string;
  level?: string;
  started_at: string;
  completed_at?: string;
  progress: number;
  course_completed: boolean;
  total_lessons: number;
  completed_lessons: number;
  total_quizzes: number;
  completed_quizzes: number;
  has_certificate: number;
}

interface ActivityItem {
  type: string;
  title: string;
  description: string;
  created_at: string;
  color: string;
  icon: string;
}

export default function EstudianteDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener estadísticas
        const statsResponse = await fetch('/api/student/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        }

        // Obtener cursos
        const coursesResponse = await fetch('/api/student/courses');
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCourses(coursesData.data);
        }

        // Obtener actividad
        const activityResponse = await fetch('/api/student/activity');
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setActivity(activityData.data);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl shadow-lg p-8">
            <h1 className="text-4xl font-bold mb-2">Mi Panel de Aprendizaje</h1>
            <p className="text-green-50 text-lg">Tu progreso y cursos activos</p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Cursos Activos"
              value={stats?.enProgreso || 0}
              icon={BookOpen}
              subtitle="En progreso"
            />
            <StatsCard
              title="Completados"
              value={stats?.completados || 0}
              icon={Award}
              subtitle="Cursos finalizados"
            />
            <StatsCard
              title="Certificados"
              value={stats?.certificados || 0}
              icon={Award}
              subtitle="Obtenidos"
            />
            <StatsCard
              title="Progreso promedio"
              value={`${stats?.progresoPromedio || 0}%`}
              icon={TrendingUp}
              subtitle="En tus cursos"
            />
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/dashboard_estudiante/explore')}
                className="bg-gray-700 hover:bg-gray-800 text-white p-5 rounded-lg transition-all hover:shadow-lg group border border-gray-600"
              >
                <BookOpen className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-semibold">Explorar Cursos</div>
              </button>
              <button
                onClick={() => router.push('/dashboard_estudiante/courses')}
                className="bg-gray-700 hover:bg-gray-800 text-white p-5 rounded-lg transition-all hover:shadow-lg group border border-gray-600"
              >
                <TrendingUp className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-semibold">Mis Cursos</div>
              </button>
              <button
                onClick={() => router.push('/dashboard_estudiante/certificates')}
                className="bg-gray-700 hover:bg-gray-800 text-white p-5 rounded-lg transition-all hover:shadow-lg group border border-gray-600"
              >
                <Award className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-semibold">Certificados</div>
              </button>
              <button
                onClick={() => router.push('/dashboard_estudiante/messages')}
                className="bg-gray-700 hover:bg-gray-800 text-white p-5 rounded-lg transition-all hover:shadow-lg group border border-gray-600"
              >
                <MessageSquare className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-semibold">Mensajes</div>
              </button>
            </div>
          </div>

          {/* Cursos en progreso */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Mis Cursos</h2>
              <button
                onClick={() => router.push('/dashboard_estudiante/courses')}
                className="text-primary hover:text-primary-dark font-medium transition-colors"
              >
                Ver todos →
              </button>
            </div>
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.slice(0, 6).map((course) => (
                  <CourseCard 
                    key={course.id} 
                    id={course.id}
                    title={course.title}
                    description={course.short_description || course.description}
                    duration={course.duration_hours || 0}
                    students={course.students_count}
                    progress={course.progress}
                    instructor={course.instructor}
                    imageUrl={course.image_url}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes cursos inscritos</h3>
                <p className="text-gray-600 mb-4">Explora nuestro catálogo y comienza tu aprendizaje</p>
                <button
                  onClick={() => router.push('/dashboard_estudiante/explore')}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Explorar Cursos
                </button>
              </div>
            )}
          </div>

          {/* Actividad reciente */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Actividad Reciente</h2>
            {activity.length > 0 ? (
              <div className="space-y-4">
                {activity.map((item, index) => {
                  const getIcon = (iconName: string) => {
                    switch (iconName) {
                      case 'BookOpen': return BookOpen;
                      case 'Award': return Award;
                      case 'FileText': return FileText;
                      default: return BookOpen;
                    }
                  };

                  const getColorClasses = (color: string) => {
                    switch (color) {
                      case 'green': return 'bg-green-100 text-green-600';
                      case 'blue': return 'bg-blue-100 text-blue-600';
                      case 'purple': return 'bg-purple-100 text-purple-600';
                      default: return 'bg-gray-100 text-gray-600';
                    }
                  };

                  const IconComponent = getIcon(item.icon);
                  const colorClasses = getColorClasses(item.color);
                  const timeAgo = new Date(item.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No hay actividad reciente</p>
                <p className="text-sm text-gray-500">Comienza un curso para ver tu progreso aquí</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

