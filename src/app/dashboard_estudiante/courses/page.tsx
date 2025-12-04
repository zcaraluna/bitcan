'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import CourseCard from '@/components/CourseCard';
import { BookOpen, Clock, Award, TrendingUp } from 'lucide-react';

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

export default function MisCursos() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/student/courses');
        if (response.ok) {
          const data = await response.json();
          setCourses(data.data);
        } else {
          setError('Error al cargar los cursos');
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Error al cargar los cursos');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course => {
    switch (filter) {
      case 'in_progress':
        return course.progress > 0 && !course.course_completed;
      case 'completed':
        return course.course_completed;
      default:
        return true;
    }
  });

  const stats = {
    total: courses.length,
    inProgress: courses.filter(c => c.progress > 0 && !c.course_completed).length,
    completed: courses.filter(c => c.course_completed).length,
    certificates: courses.filter(c => c.has_certificate > 0).length
  };

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
            <h1 className="text-4xl font-bold mb-2">Mis Cursos</h1>
            <p className="text-green-50 text-lg">Gestiona tu progreso de aprendizaje</p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Cursos</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">En Progreso</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completados</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.certificates}</div>
              <div className="text-sm text-gray-600">Certificados</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos ({stats.total})
              </button>
              <button
                onClick={() => setFilter('in_progress')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'in_progress'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                En Progreso ({stats.inProgress})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completados ({stats.completed})
              </button>
            </div>
          </div>

          {/* Lista de cursos */}
          <div>
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
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
                    href={`/dashboard_estudiante/courses/${course.id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'all' ? 'No tienes cursos inscritos' : 
                   filter === 'in_progress' ? 'No tienes cursos en progreso' : 
                   'No tienes cursos completados'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {filter === 'all' ? 'Explora nuestro catálogo y comienza tu aprendizaje' :
                   filter === 'in_progress' ? 'Comienza un curso para verlo aquí' :
                   'Completa algunos cursos para verlos aquí'}
                </p>
                <button
                  onClick={() => router.push('/dashboard_estudiante/explore')}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Explorar Cursos
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

