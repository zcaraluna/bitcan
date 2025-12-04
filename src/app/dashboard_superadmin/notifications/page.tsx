'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Users,
  BookOpen,
  Search,
  Filter
} from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_type: string;
  target_course_id: number | null;
  target_roles: string | null;
  is_active: boolean;
  created_at: string;
  created_by: number;
  creator_name?: string;
}

interface Course {
  id: number;
  title: string;
}

export default function ManageNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
    loadCourses();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      } else {
        setError('Error al cargar notificaciones');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/admin/notifications/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Notificación eliminada exitosamente');
        loadNotifications();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al eliminar notificación');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Error de conexión');
    }
  };

  const handleToggleActive = async (id: number, currentState: boolean) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentState }),
      });

      if (response.ok) {
        setSuccess(`Notificación ${!currentState ? 'activada' : 'desactivada'} exitosamente`);
        loadNotifications();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
      setError('Error de conexión');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTargetLabel = (notification: Notification) => {
    switch (notification.target_type) {
      case 'all': return 'Todos los usuarios';
      case 'estudiantes': return 'Estudiantes';
      case 'profesores': return 'Profesores';
      case 'superadmins': return 'SuperAdmins';
      case 'curso_especifico': 
        const course = courses.find(c => c.id === notification.target_course_id);
        return `Curso: ${course?.title || 'Desconocido'}`;
      case 'combinado':
        try {
          const roles = JSON.parse(notification.target_roles || '[]');
          return `Roles: ${roles.join(', ')}`;
        } catch {
          return 'Combinado';
        }
      default: return notification.target_type;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !typeFilter || notification.type === typeFilter;
    const matchesTarget = !targetFilter || notification.target_type === targetFilter;
    
    return matchesSearch && matchesType && matchesTarget;
  });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="w-8 h-8 text-gray-600" />
                Gestionar Notificaciones
              </h1>
              <p className="text-gray-600 mt-1">Crea y administra notificaciones para los usuarios del sistema</p>
            </div>
            <button
              onClick={() => { setEditingNotification(null); setShowModal(true); }}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Notificación
            </button>
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

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Título o mensaje..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Tipo
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">Todos los tipos</option>
                <option value="info">Información</option>
                <option value="warning">Advertencia</option>
                <option value="success">Éxito</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Destinatario
              </label>
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">Todos los destinatarios</option>
                <option value="all">Todos los usuarios</option>
                <option value="estudiantes">Estudiantes</option>
                <option value="profesores">Profesores</option>
                <option value="superadmins">SuperAdmins</option>
                <option value="curso_especifico">Curso específico</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Notificaciones */}
        <div className="bg-white rounded-xl border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div key={notification.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                                {notification.type}
                              </span>
                              {!notification.is_active && (
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  Inactiva
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {getTargetLabel(notification)}
                              </span>
                              <span>
                                {new Date(notification.created_at).toLocaleString('es-PY')}
                              </span>
                              {notification.creator_name && (
                                <span>por {notification.creator_name}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleToggleActive(notification.id, notification.is_active)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title={notification.is_active ? 'Desactivar' : 'Activar'}
                            >
                              {notification.is_active ? (
                                <Eye className="w-4 h-4 text-gray-600" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => { setEditingNotification(notification); setShowModal(true); }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-12">
                  No hay notificaciones que coincidan con los filtros
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Crear/Editar */}
      {showModal && (
        <NotificationModal
          notification={editingNotification}
          courses={courses}
          onSave={async (data) => {
            try {
              const url = editingNotification 
                ? `/api/admin/notifications/${editingNotification.id}`
                : '/api/admin/notifications';
              
              const method = editingNotification ? 'PUT' : 'POST';
              
              const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });

              if (response.ok) {
                setSuccess(editingNotification ? 'Notificación actualizada' : 'Notificación creada');
                setShowModal(false);
                setEditingNotification(null);
                loadNotifications();
                setTimeout(() => setSuccess(''), 5000);
              } else {
                const result = await response.json();
                setError(result.message || 'Error al guardar notificación');
              }
            } catch (error) {
              console.error('Error saving notification:', error);
              setError('Error de conexión');
            }
          }}
          onClose={() => {
            setShowModal(false);
            setEditingNotification(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

// Componente Modal
interface NotificationModalProps {
  notification: Notification | null;
  courses: Course[];
  onSave: (data: any) => void;
  onClose: () => void;
}

function NotificationModal({ notification, courses, onSave, onClose }: NotificationModalProps) {
  const [formData, setFormData] = useState({
    title: notification?.title || '',
    message: notification?.message || '',
    type: notification?.type || 'info',
    target_type: notification?.target_type || 'all',
    target_course_id: notification?.target_course_id?.toString() || '',
    target_roles: notification?.target_roles || '',
    is_active: notification?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: any = {
      title: formData.title,
      message: formData.message,
      type: formData.type,
      target_type: formData.target_type,
      is_active: formData.is_active,
    };

    if (formData.target_type === 'curso_especifico') {
      data.target_course_id = parseInt(formData.target_course_id);
    }

    if (formData.target_type === 'combinado') {
      data.target_roles = formData.target_roles;
    }

    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {notification ? 'Editar Notificación' : 'Nueva Notificación'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="info">Información</option>
                <option value="warning">Advertencia</option>
                <option value="success">Éxito</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destinatario *
              </label>
              <select
                value={formData.target_type}
                onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="all">Todos los usuarios</option>
                <option value="estudiantes">Estudiantes</option>
                <option value="profesores">Profesores</option>
                <option value="superadmins">SuperAdmins</option>
                <option value="curso_especifico">Curso específico</option>
                <option value="combinado">Combinado</option>
              </select>
            </div>
          </div>

          {formData.target_type === 'curso_especifico' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Curso *
              </label>
              <select
                value={formData.target_course_id}
                onChange={(e) => setFormData({ ...formData, target_course_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                required
              >
                <option value="">Seleccione un curso</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.target_type === 'combinado' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Roles (JSON) *
              </label>
              <input
                type="text"
                value={formData.target_roles}
                onChange={(e) => setFormData({ ...formData, target_roles: e.target.value })}
                placeholder='["estudiante", "profesor"]'
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Formato: [&quot;rol1&quot;, &quot;rol2&quot;]
              </p>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Notificación activa
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
            >
              {notification ? 'Actualizar' : 'Crear'} Notificación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
