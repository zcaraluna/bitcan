'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  BookOpen, 
  Users, 
  Settings,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp
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

function CoursesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
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

      const response = await fetch(`/api/professor/courses?page=${page}&per_page=10`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCourses(data.data);
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/dashboard_profesor/courses?page=${newPage}`);
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
              <h1 className="text-4xl font-bold mb-2">Mis Cursos</h1>
              <p className="text-green-50 text-lg">Gestiona todos tus cursos asignados</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{pagination.total}</div>
              <div className="text-green-50">Cursos Totales</div>
            </div>
          </div>
        </div>

        {/* Cursos */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              <BookOpen className="w-5 h-5 inline mr-2" />
              Lista de Cursos
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
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard_profesor/courses/${course.id}`);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Gestionar Curso"
                          >
                            <Settings className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/cursos/${course.id}`);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard_profesor/courses/${course.id}?tab=students`);
                            }}
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
    </DashboardLayout>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    }>
      <CoursesContent />
    </Suspense>
  );
}

