'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Search, Filter, Plus, Edit, Eye, Trash2, Users, BookOpen, Calendar, DollarSign, GraduationCap } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  identifier: string;
  status: string;
  is_published: boolean;
  enrollment_start_date: string;
  enrollment_end_date: string;
  duration_hours: number;
  price: number;
  price_pyg?: number;
  is_free: boolean;
  exchange_rate_usd?: number;
  exchange_rate_ars?: number;
  exchange_rate_brl?: number;
  rates_snapshot_at?: string;
  total_students: number;
  total_lessons: number;
  instructors: string;
  created_at: string;
}

interface Instructor {
  id: number;
  name: string;
  email: string;
}

export default function ManageCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const coursesPerPage = 20;

  useEffect(() => {
    loadCourses();
    loadInstructors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, statusFilter]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: coursesPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/courses?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);
        setTotalPages(data.totalPages);
      } else {
        setError('Error al cargar cursos');
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadInstructors = async () => {
    try {
      const response = await fetch('/api/admin/instructors');
      if (response.ok) {
        const data = await response.json();
        setInstructors(data.instructors);
      }
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadCourses();
  };

  const handleCreateCourse = async (courseData: any) => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        loadCourses();
      } else {
        const data = await response.json();
        setError(data.message || 'Error al crear curso');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      setError('Error de conexión');
    }
  };

  const handleEditCourse = async (updatedCourse: Course) => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCourse),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedCourse(null);
        loadCourses();
      } else {
        const data = await response.json();
        setError(data.message || 'Error al actualizar curso');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      setError('Error de conexión');
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este curso?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      });

      if (response.ok) {
        loadCourses();
      } else {
        const data = await response.json();
        setError(data.message || 'Error al eliminar curso');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      setError('Error de conexión');
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      const response = await fetch('/api/admin/courses/toggle-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          course_id: course.id, 
          is_published: !course.is_published 
        }),
      });

      if (response.ok) {
        loadCourses();
      } else {
        const data = await response.json();
        setError(data.error || 'Error al cambiar estado de publicación');
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
      setError('Error de conexión');
    }
  };

  const handleManageCertificates = (course: Course) => {
    router.push(`/dashboard_superadmin/v2/certificates/generate/${course.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activo': return 'bg-green-100 text-green-800';
      case 'inactivo': return 'bg-red-100 text-red-800';
      case 'borrador': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-gray-600" />
                Gestionar Cursos
              </h1>
              <p className="text-gray-600 mt-1">Administra todos los cursos del sistema</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Curso
            </button>
          </div>
        </div>

        {/* Filtros de búsqueda */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Título, descripción, identificador..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="borrador">Borrador</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Buscar
              </button>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setStatusFilter(''); setCurrentPage(1); loadCourses(); }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabla de cursos */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Curso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estudiantes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Instructores
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Publicado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Creado
                      </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Certificados
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{course.title}</div>
                            <div className="text-sm text-gray-500">{course.identifier}</div>
                            <div className="text-xs text-gray-400 mt-1 line-clamp-2">{course.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(course.status)}`}>
                            {course.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            {course.total_students}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.is_free ? (
                            <span className="text-green-600 font-medium">Gratis</span>
                          ) : (
                            <div>
                              <div className="font-medium">₲ {Math.round(course.price_pyg || course.price || 0).toLocaleString('es-PY', { useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                              {course.exchange_rate_usd && course.price_pyg && (
                                <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                                  <div>USD {(course.price_pyg / course.exchange_rate_usd).toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                  {course.exchange_rate_ars && <div>ARS {Math.round(course.price_pyg / course.exchange_rate_ars).toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>}
                                  {course.exchange_rate_brl && <div>BRL {(course.price_pyg / course.exchange_rate_brl).toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="line-clamp-2">{course.instructors || 'Sin instructores'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleTogglePublish(course)}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              course.is_published 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                            title={course.is_published ? 'Click para despublicar' : 'Click para publicar'}
                          >
                            {course.is_published ? '✓ Publicado' : '✗ No publicado'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(course.created_at).toLocaleDateString('es-PY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => handleManageCertificates(course)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm font-medium transition-colors"
                            title="Gestionar certificados"
                          >
                            <GraduationCap className="w-4 h-4" />
                            Certificados
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setSelectedCourse(course); setShowEditModal(true); }}
                              className="text-blue-600 hover:text-blue-800"
                              title="Editar curso"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard_superadmin/courses/${course.id}`)}
                              className="text-green-600 hover:text-green-800"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar curso"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de creación */}
      {showCreateModal && (
        <CourseModal
          instructors={instructors}
          onSave={handleCreateCourse}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Modal de edición */}
      {showEditModal && selectedCourse && (
        <CourseModal
          course={selectedCourse}
          instructors={instructors}
          onSave={handleEditCourse}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCourse(null);
          }}
        />
      )}

    </DashboardLayout>
  );
}

// Componente Modal de Curso Completo (igual al original)
interface CourseModalProps {
  course?: Course;
  instructors: Instructor[];
  onSave: (course: any) => void;
  onClose: () => void;
}

interface Category {
  id: number;
  name: string;
}

function CourseModal({ course, instructors, onSave, onClose }: CourseModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [liveRates, setLiveRates] = useState({ USD: 7300, ARS: 7.50, BRL: 1450 }); // Default rates
  const [loadingCourse, setLoadingCourse] = useState(!!course);
  const [formData, setFormData] = useState({
    // ID del curso (para edición)
    id: course?.id || null,
    
    // Información Básica
    title: course?.title || '',
    identifier: course?.identifier || '',
    short_description: '',
    description: course?.description || '',
    
    // Clasificación
    category_id: 1,
    level: 'beginner',
    status: course?.status || 'activo',
    
    // Duración y Precio
    duration_hours: course?.duration_hours || 0,
    duration_minutes: 0,
    price: course?.price || 0,
    price_pyg: course?.price_pyg || 0,
    is_free: course?.is_free || false,
    
    // Fechas
    enrollment_start_date: course?.enrollment_start_date?.split('T')[0] || '',
    enrollment_end_date: course?.enrollment_end_date?.split('T')[0] || '',
    course_start_date: '',
    course_end_date: '',
    
    // Configuración
    max_students: '',
    requires_approval: false,
    is_featured: false,
    is_published: true, // Por defecto publicado
    sort_order: 0,
    
    // Contenido
    requirements: '',
    learning_objectives: '',
    thumbnail_url: '',
    video_url: '',
    
    // Información de Pago
    payment_bank: '',
    payment_account: '',
    payment_holder: '',
    payment_id: '',
    payment_ruc: '',
    payment_alias: '',
    payment_whatsapp: '',
    payment_crypto_wallet: '',
    payment_crypto_network: '',
    payment_crypto_currency: '',
    
    // Instructores
    instructor_ids: [] as number[],
  });

  // Cargar datos completos del curso si estamos editando
  useEffect(() => {
    if (course?.id) {
      loadCourseDetails(course.id);
    }
  }, [course?.id]);

  const loadCourseDetails = async (courseId: number) => {
    try {
      setLoadingCourse(true);
      const response = await fetch(`/api/admin/courses/${courseId}/details`);
      if (response.ok) {
        const data = await response.json();
        const c = data.course;
        
        // Cargar instructores del curso
        const instructorResponse = await fetch(`/api/admin/courses/${courseId}/instructors`);
        let courseInstructorIds: number[] = [];
        if (instructorResponse.ok) {
          const instructorData = await instructorResponse.json();
          courseInstructorIds = instructorData.instructors?.map((i: any) => i.id) || [];
        }
        
        setFormData({
          id: c.id,
          title: c.title || '',
          identifier: c.identifier || '',
          short_description: c.short_description || '',
          description: c.description || '',
          category_id: c.category_id || 1,
          level: c.level || 'beginner',
          status: c.status || 'activo',
          duration_hours: c.duration_hours || 0,
          duration_minutes: c.duration_minutes || 0,
          price: c.price || 0,
          price_pyg: c.price_pyg || 0,
          is_free: c.is_free || false,
          enrollment_start_date: c.enrollment_start_date?.split('T')[0] || '',
          enrollment_end_date: c.enrollment_end_date?.split('T')[0] || '',
          course_start_date: c.course_start_date?.split('T')[0] || '',
          course_end_date: c.course_end_date?.split('T')[0] || '',
          max_students: c.max_students || '',
          requires_approval: c.requires_approval || false,
          is_featured: c.is_featured || false,
          is_published: c.is_published || false,
          sort_order: c.sort_order || 0,
          requirements: c.requirements || '',
          learning_objectives: c.learning_objectives || '',
          thumbnail_url: c.thumbnail_url || '',
          video_url: c.video_url || '',
          payment_bank: c.payment_bank || '',
          payment_account: c.payment_account || '',
          payment_holder: c.payment_holder || '',
          payment_id: c.payment_id || '',
          payment_ruc: c.payment_ruc || '',
          payment_alias: c.payment_alias || '',
          payment_whatsapp: c.payment_whatsapp || '',
          payment_crypto_wallet: c.payment_crypto_wallet || '',
          payment_crypto_network: c.payment_crypto_network || '',
          payment_crypto_currency: c.payment_crypto_currency || '',
          instructor_ids: courseInstructorIds,
        });
      }
    } catch (error) {
      console.error('Error loading course details:', error);
    } finally {
      setLoadingCourse(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadLiveRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLiveRates = async () => {
    try {
      const response = await fetch('/api/exchange-rates/live');
      if (response.ok) {
        const data = await response.json();
        setLiveRates(data.rates);
      }
    } catch (error) {
      console.error('Error loading live rates:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Agregar las tasas de cambio actuales al momento de guardar
    const dataToSave = {
      ...formData,
      exchange_rate_usd: liveRates.USD,
      exchange_rate_ars: liveRates.ARS,
      exchange_rate_brl: liveRates.BRL,
    };
    onSave(dataToSave);
  };

  const generateIdentifier = () => {
    // Formato: 2 números + 2 letras (ej: 12AB)
    const numbers = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const letters = Math.random().toString(36).substring(2, 4).toUpperCase();
    setFormData({ ...formData, identifier: `${numbers}${letters}` });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {course ? 'Editar Curso' : 'Crear Nuevo Curso'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {loadingCourse ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Sección 1: Información Básica */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">1</span>
              Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Curso <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Nombre completo del curso</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identificador <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    placeholder="Ej: 12AB"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateIdentifier}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    Generar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Formato: 2 números + 2 letras</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Corta
                </label>
                <textarea
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  rows={3}
                  placeholder="Descripción breve para el catálogo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">Máximo 500 caracteres</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Completa <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Descripción detallada del curso..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Clasificación y Categorización */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">2</span>
              Clasificación y Categorización
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="borrador">Borrador</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección 3: Duración y Precio */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mr-3">3</span>
              Duración y Precio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (horas)
                </label>
                <input
                  type="number"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="59"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio (PYG)
                </label>
                <input
                  type="number"
                  value={formData.price_pyg}
                  onChange={(e) => setFormData({ ...formData, price_pyg: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="1000"
                  disabled={formData.is_free}
                  placeholder="Ej: 500000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:bg-gray-100"
                />
                {!formData.is_free && formData.price_pyg > 0 && (
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <div>≈ USD {(formData.price_pyg / liveRates.USD).toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div>≈ ARS {Math.round(formData.price_pyg / liveRates.ARS).toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                    <div>≈ BRL {(formData.price_pyg / liveRates.BRL).toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-blue-600 mt-2">Tasas en tiempo real</div>
                  </div>
                )}
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_free}
                    onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                    className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Curso gratuito</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sección 4: Fechas */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mr-3">4</span>
              Fechas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inicio Inscripciones
                </label>
                <input
                  type="date"
                  value={formData.enrollment_start_date}
                  onChange={(e) => setFormData({ ...formData, enrollment_start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fin Inscripciones
                </label>
                <input
                  type="date"
                  value={formData.enrollment_end_date}
                  onChange={(e) => setFormData({ ...formData, enrollment_end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inicio del Curso
                </label>
                <input
                  type="date"
                  value={formData.course_start_date}
                  onChange={(e) => setFormData({ ...formData, course_start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fin del Curso
                </label>
                <input
                  type="date"
                  value={formData.course_end_date}
                  onChange={(e) => setFormData({ ...formData, course_end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Sección 5: Configuración */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 mr-3">5</span>
              Configuración
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo Estudiantes
                </label>
                <input
                  type="number"
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orden de Visualización
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.requires_approval}
                    onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                    className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Requiere Aprobación</span>
                </label>
              </div>
              <div className="flex items-end space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Destacado</span>
                </label>
              </div>
              <div className="flex items-end space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 font-medium">Publicar Curso</span>
                </label>
              </div>
            </div>
            {!formData.is_published && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ El curso no será visible para los estudiantes hasta que lo publiques.
                </p>
              </div>
            )}
          </div>

          {/* Sección 6: Instructores */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-3">6</span>
              Instructores <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {instructors.map((instructor) => (
                <label key={instructor.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.instructor_ids.includes(instructor.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          instructor_ids: [...formData.instructor_ids, instructor.id]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          instructor_ids: formData.instructor_ids.filter(id => id !== instructor.id)
                        });
                      }
                    }}
                    className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                  />
                  <span className="text-sm text-gray-700">{instructor.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sección 7: Contenido del Curso */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mr-3">7</span>
              Contenido del Curso
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requisitos Previos
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={4}
                  placeholder="Conocimientos o habilidades previas necesarias..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objetivos de Aprendizaje
                </label>
                <textarea
                  value={formData.learning_objectives}
                  onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
                  rows={4}
                  placeholder="Qué aprenderá el estudiante..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Sección 8: Información de Pago */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mr-3">8</span>
              Información de Pago
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entidad (Banco)
                </label>
                <input
                  type="text"
                  value={formData.payment_bank}
                  onChange={(e) => setFormData({ ...formData, payment_bank: e.target.value })}
                  placeholder="Ej: Bueno bank S.A."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  N° de Cuenta
                </label>
                <input
                  type="text"
                  value={formData.payment_account}
                  onChange={(e) => setFormData({ ...formData, payment_account: e.target.value })}
                  placeholder="Ej: 6192388366"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titular
                </label>
                <input
                  type="text"
                  value={formData.payment_holder}
                  onChange={(e) => setFormData({ ...formData, payment_holder: e.target.value })}
                  placeholder="Ej: BITCAN PY - CONSULTORES EN CIBERSEGURIDAD"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CI
                </label>
                <input
                  type="text"
                  value={formData.payment_id}
                  onChange={(e) => setFormData({ ...formData, payment_id: e.target.value })}
                  placeholder="Ej: 5446588"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUC
                </label>
                <input
                  type="text"
                  value={formData.payment_ruc}
                  onChange={(e) => setFormData({ ...formData, payment_ruc: e.target.value })}
                  placeholder="Ej: 5446588-5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alias (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.payment_alias}
                  onChange={(e) => setFormData({ ...formData, payment_alias: e.target.value })}
                  placeholder="Ej: bitcan.py"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.payment_whatsapp}
                  onChange={(e) => setFormData({ ...formData, payment_whatsapp: e.target.value })}
                  placeholder="Ej: +595 973 408 754"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Información de Pago Cripto */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Información de Pago Cripto (Opcional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda Cripto
                  </label>
                  <select
                    value={formData.payment_crypto_currency}
                    onChange={(e) => setFormData({ ...formData, payment_crypto_currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="USDT">USDT</option>
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                    <option value="BNB">Binance Coin (BNB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Red
                  </label>
                  <select
                    value={formData.payment_crypto_network}
                    onChange={(e) => setFormData({ ...formData, payment_crypto_network: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="TRC20">TRC20 (Tron)</option>
                    <option value="ERC20">ERC20 (Ethereum)</option>
                    <option value="BEP20">BEP20 (Binance Smart Chain)</option>
                    <option value="BTC">Bitcoin Network</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección de Billetera
                  </label>
                  <input
                    type="text"
                    value={formData.payment_crypto_wallet}
                    onChange={(e) => setFormData({ ...formData, payment_crypto_wallet: e.target.value })}
                    placeholder="Ej: Txxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
            >
              {course ? 'Actualizar' : 'Crear'} Curso
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
