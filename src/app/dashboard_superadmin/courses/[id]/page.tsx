'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Calendar,
  DollarSign,
  Award,
  FileText,
  UserPlus,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';

interface CourseDetails {
  id: number;
  title: string;
  description: string;
  identifier: string;
  status: string;
  duration_hours: number;
  price: number;
  price_pyg?: number;
  exchange_rate_usd?: number;
  exchange_rate_ars?: number;
  exchange_rate_brl?: number;
  is_free: boolean;
  enrollment_start_date: string;
  enrollment_end_date: string;
  total_students: number;
  total_lessons: number;
  instructors: string;
}

interface EnrolledStudent {
  id: number;
  name: string;
  email: string;
  started_at: string;
  completed: boolean;
  completed_at: string | null;
  progress: number;
  lessons_completed: number;
  total_lessons: number;
}

interface Application {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  application_date: string;
  status: string;
  motivation?: string;
}

interface AvailableStudent {
  id: number;
  name: string;
  email: string;
}

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'applications'>('students');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, studentsRes, applicationsRes] = await Promise.all([
        fetch(`/api/admin/courses/${courseId}/details`),
        fetch(`/api/admin/courses/${courseId}/students`),
        fetch(`/api/admin/courses/${courseId}/applications`)
      ]);

      if (courseRes.ok) {
        const data = await courseRes.json();
        setCourse(data.course);
      }

      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data.students);
      }

      if (applicationsRes.ok) {
        const data = await applicationsRes.json();
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      setError('Error al cargar datos del curso');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (applicationId: number) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/applications/${applicationId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess('Postulación aprobada y estudiante inscrito');
        loadCourseData();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al aprobar postulación');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      setError('Error de conexión');
    }
  };

  const handleRejectApplication = async (applicationId: number) => {
    if (!confirm('¿Estás seguro de rechazar esta postulación?')) return;

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/applications/${applicationId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess('Postulación rechazada');
        loadCourseData();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al rechazar postulación');
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      setError('Error de conexión');
    }
  };

  const handleRemoveStudent = async (userId: number) => {
    if (!confirm('¿Estás seguro de eliminar este estudiante del curso?')) return;

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/students/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Estudiante eliminado del curso');
        loadCourseData();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al eliminar estudiante');
      }
    } catch (error) {
      console.error('Error removing student:', error);
      setError('Error de conexión');
    }
  };

  const handleToggleCompletion = async (userId: number, currentlyCompleted: boolean) => {
    const action = currentlyCompleted ? 'desmarcar como completado' : 'marcar como completado';
    if (!confirm(`¿Estás seguro de ${action} este curso para este estudiante?`)) return;

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/students/${userId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentlyCompleted }),
      });

      if (response.ok) {
        setSuccess(`Curso ${currentlyCompleted ? 'desmarcado' : 'marcado'} como completado`);
        loadCourseData();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.error || `Error al ${action}`);
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      setError('Error de conexión');
    }
  };

  const loadAvailableStudents = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/available-students`);
      if (response.ok) {
        const data = await response.json();
        setAvailableStudents(data.students);
        setShowEnrollModal(true);
      }
    } catch (error) {
      console.error('Error loading available students:', error);
      setError('Error al cargar estudiantes disponibles');
    }
  };

  const handleEnrollStudent = async (studentId: number) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: studentId }),
      });

      if (response.ok) {
        setSuccess('Estudiante inscrito exitosamente');
        setShowEnrollModal(false);
        loadCourseData();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al inscribir estudiante');
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      setError('Error de conexión');
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

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center text-gray-500 py-12">
          Curso no encontrado
        </div>
      </DashboardLayout>
    );
  }

  const pendingApplications = applications.filter(a => a.status === 'pending').length;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-gray-600" />
                {course.title}
              </h1>
              <p className="text-gray-600 mt-2">{course.description}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {course.identifier}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {course.duration_hours}h
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.total_students} estudiantes
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                course.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {course.status}
              </span>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <Users className="w-6 h-6 text-gray-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{course.total_students}</div>
            <div className="text-sm text-gray-600">Estudiantes</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <FileText className="w-6 h-6 text-gray-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{course.total_lessons}</div>
            <div className="text-sm text-gray-600">Lecciones</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <UserPlus className="w-6 h-6 text-gray-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{pendingApplications}</div>
            <div className="text-sm text-gray-600">Postulaciones</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <DollarSign className="w-6 h-6 text-gray-600 mb-2" />
            {course.is_free ? (
              <>
                <div className="text-2xl font-bold text-gray-900">Gratis</div>
                <div className="text-sm text-gray-600">Precio</div>
              </>
            ) : (
              <>
                <div className="text-lg font-bold text-gray-900">
                  ₲ {Math.round(course.price_pyg || course.price || 0).toLocaleString('es-PY', { useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                {course.exchange_rate_usd && course.exchange_rate_usd > 0 && (course.price_pyg || course.price) && (
                  <div className="text-sm text-gray-600">
                    USD {((course.price_pyg || course.price) / course.exchange_rate_usd).toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
                {course.exchange_rate_ars && course.exchange_rate_ars > 0 && (course.price_pyg || course.price) && (
                  <div className="text-sm text-gray-600">
                    ARS {Math.round((course.price_pyg || course.price) / course.exchange_rate_ars).toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                )}
                {course.exchange_rate_brl && course.exchange_rate_brl > 0 && (course.price_pyg || course.price) && (
                  <div className="text-sm text-gray-600">
                    BRL {((course.price_pyg || course.price) / course.exchange_rate_brl).toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">Precio</div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('students')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'students'
                    ? 'border-gray-700 text-gray-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                Estudiantes Inscritos ({students.length})
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'applications'
                    ? 'border-gray-700 text-gray-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Postulaciones ({pendingApplications})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tab Estudiantes */}
            {activeTab === 'students' && (
              <div className="space-y-4">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={loadAvailableStudents}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Inscribir Estudiante
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inscripción</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progreso</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{student.name}</div>
                            <div className="text-xs text-gray-500">{student.email}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(student.started_at).toLocaleDateString('es-PY')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${student.progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700">{student.progress}%</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {student.lessons_completed} / {student.total_lessons} lecciones
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {student.completed ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                En Progreso
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleCompletion(student.id, student.completed)}
                                className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                                  student.completed
                                    ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                                    : 'text-green-700 bg-green-50 hover:bg-green-100'
                                }`}
                                title={student.completed ? 'Desmarcar como completado' : 'Marcar como completado'}
                              >
                                {student.completed ? 'Desmarcar' : 'Completar'}
                              </button>
                              <button
                                onClick={() => handleRemoveStudent(student.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {students.length === 0 && (
                    <div className="text-center text-gray-500 py-12">
                      No hay estudiantes inscritos en este curso
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Postulaciones */}
            {activeTab === 'applications' && (
              <div className="space-y-4">
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <div key={app.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-bold">
                                {app.user_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{app.user_name}</div>
                              <div className="text-sm text-gray-500">{app.user_email}</div>
                            </div>
                          </div>
                          {app.motivation && (
                            <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                              <div className="text-xs font-medium text-gray-500 mb-1">Motivación:</div>
                              <div className="text-sm text-gray-700">{app.motivation}</div>
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-2">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Postulado el {new Date(app.application_date).toLocaleDateString('es-PY')}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {app.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApproveApplication(app.id)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleRejectApplication(app.id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                Rechazar
                              </button>
                            </>
                          ) : (
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              app.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {app.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    No hay postulaciones para este curso
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Inscribir Estudiante */}
      {showEnrollModal && (
        <EnrollStudentModal
          students={availableStudents}
          onEnroll={handleEnrollStudent}
          onClose={() => setShowEnrollModal(false)}
        />
      )}
    </DashboardLayout>
  );
}

// Modal para Inscribir Estudiante
interface EnrollStudentModalProps {
  students: AvailableStudent[];
  onEnroll: (studentId: number) => void;
  onClose: () => void;
}

function EnrollStudentModal({ students, onEnroll, onClose }: EnrollStudentModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Inscribir Estudiante</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full mt-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>

        <div className="overflow-y-auto max-h-[50vh] p-6">
          {filteredStudents.length > 0 ? (
            <div className="space-y-2">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </div>
                  <button
                    onClick={() => onEnroll(student.id)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm"
                  >
                    Inscribir
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes disponibles para inscribir'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
