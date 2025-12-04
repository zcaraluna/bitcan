'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Ticket, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Percent,
  DollarSign,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_percentage: number;
  min_price: number;
  max_uses: number;
  one_time_per_user: boolean;
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
  total_uses: number;
  applicable_courses: string | null;
}

interface Course {
  id: number;
  title: string;
}

interface CouponUsage {
  id: number;
  user_name: string;
  user_email: string;
  course_title: string;
  used_at: string;
}

export default function ManageCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [selectedCouponHistory, setSelectedCouponHistory] = useState<CouponUsage[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCoupons();
    loadCourses();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/coupons');
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons);
      } else {
        setError('Error al cargar cupones');
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/admin/coupons/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cupón?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Cupón eliminado exitosamente');
        loadCoupons();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al eliminar cupón');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      setError('Error de conexión');
    }
  };

  const handleViewHistory = async (couponId: number) => {
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}/history`);
      if (response.ok) {
        const data = await response.json();
        setSelectedCouponHistory(data.history);
        setShowHistoryModal(true);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setError('Error al cargar historial');
    }
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isMaxUsesReached = (coupon: Coupon) => {
    return coupon.max_uses > 0 && coupon.total_uses >= coupon.max_uses;
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Ticket className="w-8 h-8 text-gray-600" />
                Gestionar Cupones
              </h1>
              <p className="text-gray-600 mt-1">Administra cupones de descuento para los cursos</p>
            </div>
            <button
              onClick={() => { setEditingCoupon(null); setShowModal(true); }}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Cupón
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

        {/* Lista de Cupones */}
        <div className="bg-white rounded-xl border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descuento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Válido Hasta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coupons.map((coupon) => {
                    const expired = isExpired(coupon.expiry_date);
                    const maxReached = isMaxUsesReached(coupon);
                    const effectivelyActive = coupon.is_active && !expired && !maxReached;

                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-bold text-gray-900">{coupon.code}</div>
                              {coupon.description && (
                                <div className="text-xs text-gray-500">{coupon.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Percent className="w-4 h-4 text-green-600" />
                            <span className="font-bold text-green-600">{coupon.discount_percentage}%</span>
                          </div>
                          {coupon.min_price > 0 && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Min: ${coupon.min_price.toLocaleString('es-PY')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {coupon.total_uses}
                              {coupon.max_uses > 0 && ` / ${coupon.max_uses}`}
                            </span>
                          </div>
                          {coupon.one_time_per_user && (
                            <div className="text-xs text-blue-600">Único por usuario</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {coupon.expiry_date ? (
                            <div className={`flex items-center gap-1 text-sm ${expired ? 'text-red-600' : 'text-gray-600'}`}>
                              <Calendar className="w-4 h-4" />
                              {new Date(coupon.expiry_date).toLocaleDateString('es-PY')}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Sin expiración</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {effectivelyActive ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Activo
                            </span>
                          ) : expired ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Expirado
                            </span>
                          ) : maxReached ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Límite alcanzado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewHistory(coupon.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Ver historial"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingCoupon(coupon); setShowModal(true); }}
                              className="text-green-600 hover:text-green-800"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(coupon.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {coupons.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  No hay cupones creados
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Crear/Editar */}
      {showModal && (
        <CouponModal
          coupon={editingCoupon}
          courses={courses}
          onSave={async (data) => {
            try {
              const url = editingCoupon 
                ? `/api/admin/coupons/${editingCoupon.id}`
                : '/api/admin/coupons';
              
              const method = editingCoupon ? 'PUT' : 'POST';
              
              const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });

              if (response.ok) {
                setSuccess(editingCoupon ? 'Cupón actualizado' : 'Cupón creado');
                setShowModal(false);
                setEditingCoupon(null);
                loadCoupons();
                setTimeout(() => setSuccess(''), 5000);
              } else {
                const result = await response.json();
                setError(result.message || 'Error al guardar cupón');
              }
            } catch (error) {
              console.error('Error saving coupon:', error);
              setError('Error de conexión');
            }
          }}
          onClose={() => {
            setShowModal(false);
            setEditingCoupon(null);
          }}
        />
      )}

      {/* Modal de Historial */}
      {showHistoryModal && (
        <HistoryModal
          history={selectedCouponHistory}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </DashboardLayout>
  );
}

// Modal de Crear/Editar Cupón
interface CouponModalProps {
  coupon: Coupon | null;
  courses: Course[];
  onSave: (data: any) => void;
  onClose: () => void;
}

function CouponModal({ coupon, courses, onSave, onClose }: CouponModalProps) {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    description: coupon?.description || '',
    discount_percentage: coupon?.discount_percentage || 10,
    min_price: coupon?.min_price || 0,
    max_uses: coupon?.max_uses || 0,
    one_time_per_user: coupon?.one_time_per_user || false,
    expiry_date: coupon?.expiry_date ? new Date(coupon.expiry_date).toISOString().split('T')[0] : '',
    is_active: coupon?.is_active ?? true,
    application_type: 'all' as 'all' | 'specific',
    specific_courses: [] as number[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleCourse = (courseId: number) => {
    setFormData(prev => ({
      ...prev,
      specific_courses: prev.specific_courses.includes(courseId)
        ? prev.specific_courses.filter(id => id !== courseId)
        : [...prev.specific_courses, courseId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">
            {coupon ? 'Editar Cupón' : 'Nuevo Cupón'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                required
                disabled={!!coupon}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                % Descuento *
              </label>
              <input
                type="number"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
                min="1"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Mínimo
              </label>
              <input
                type="number"
                value={formData.min_price}
                onChange={(e) => setFormData({ ...formData, min_price: parseFloat(e.target.value) })}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usos Máximos (0 = ilimitado)
              </label>
              <input
                type="number"
                value={formData.max_uses}
                onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Expiración
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.one_time_per_user}
                onChange={(e) => setFormData({ ...formData, one_time_per_user: e.target.checked })}
                className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Uso único por usuario
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Cupón activo
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aplicación
            </label>
            <select
              value={formData.application_type}
              onChange={(e) => setFormData({ ...formData, application_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              <option value="all">Todos los cursos</option>
              <option value="specific">Cursos específicos</option>
            </select>
          </div>

          {formData.application_type === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Cursos
              </label>
              <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={formData.specific_courses.includes(course.id)}
                      onChange={() => toggleCourse(course.id)}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-900 cursor-pointer flex-1">
                      {course.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              {coupon ? 'Actualizar' : 'Crear'} Cupón
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de Historial
interface HistoryModalProps {
  history: CouponUsage[];
  onClose: () => void;
}

function HistoryModal({ history, onClose }: HistoryModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-gray-600" />
              Historial de Uso
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
        </div>

        <div className="p-6">
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((usage) => (
                    <tr key={usage.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{usage.user_name}</div>
                        <div className="text-xs text-gray-500">{usage.user_email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{usage.course_title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(usage.used_at).toLocaleString('es-PY')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Este cupón aún no ha sido utilizado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}














