'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Search, Filter, Edit, Eye, UserCheck, UserX, RefreshCw, Users } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  profile_completed: boolean;
  created_at: string;
  last_login: string;
  total_courses: number;
  total_applications: number;
  telefono?: string;
  ciudad?: string;
  pais?: string;
  departamento?: string;
  tipo_documento?: string;
  numero_documento?: string;
  fecha_nacimiento?: string;
  genero?: string;
  barrio?: string;
  direccion?: string;
  ocupacion?: string;
  empresa?: string;
}

interface RoleStats {
  [key: string]: number;
}

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleStats, setRoleStats] = useState<RoleStats>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const usersPerPage = 20;

  useEffect(() => {
    loadUsers();
    loadRoleStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
      } else {
        setError('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadRoleStats = async () => {
    try {
      const response = await fetch('/api/admin/role-stats');
      if (response.ok) {
        const data = await response.json();
        setRoleStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading role stats:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleSaveUser = async (updatedUser: User) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedUser(null);
        loadUsers();
        loadRoleStats();
      } else {
        const data = await response.json();
        setError(data.message || 'Error al actualizar usuario');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Error de conexión');
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!confirm('¿Estás seguro de que quieres restablecer la contraseña de este usuario?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        alert('Contraseña restablecida exitosamente');
      } else {
        const data = await response.json();
        setError(data.message || 'Error al restablecer contraseña');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Error de conexión');
    }
  };

  const handleToggleActive = async (userId: number, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/users/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, is_active: !isActive }),
      });

      if (response.ok) {
        loadUsers();
        loadRoleStats();
      } else {
        const data = await response.json();
        setError(data.message || 'Error al cambiar estado del usuario');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Error de conexión');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800';
      case 'profesor': return 'bg-blue-100 text-blue-800';
      case 'estudiante': return 'bg-green-100 text-green-800';
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
                <Users className="w-8 h-8 text-gray-600" />
                Gestionar Usuarios
              </h1>
              <p className="text-gray-600 mt-1">Administra y edita todos los datos de los usuarios del sistema</p>
            </div>
            <button
              onClick={() => { setCurrentPage(1); loadUsers(); }}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>

          {/* Estadísticas por rol */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(roleStats).map(([role, count]) => (
              <div key={role} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${getRoleColor(role)}`}>
                  {role}
                </div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
              </div>
            ))}
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
                placeholder="Nombre, email, teléfono, documento..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Rol
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">Todos los roles</option>
                <option value="superadmin">SuperAdmin</option>
                <option value="profesor">Profesor</option>
                <option value="estudiante">Estudiante</option>
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
                onClick={() => { setSearchTerm(''); setRoleFilter(''); setCurrentPage(1); loadUsers(); }}
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

        {/* Tabla de usuarios */}
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
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cursos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-bold">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              {user.telefono && (
                                <div className="text-xs text-gray-400">{user.telefono}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                              user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                              user.email_verified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.email_verified ? 'Verificado' : 'Sin verificar'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.total_courses} cursos
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('es-PY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Editar usuario"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(user.id, user.is_active)}
                              className={user.is_active ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}
                              title={user.is_active ? "Desactivar usuario" : "Activar usuario"}
                            >
                              {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleResetPassword(user.id)}
                              className="text-orange-600 hover:text-orange-800"
                              title="Restablecer contraseña"
                            >
                              <RefreshCw className="w-4 h-4" />
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

      {/* Modal de edición */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onSave={handleSaveUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

// Componente Modal de Edición de Usuario
interface EditUserModalProps {
  user: User;
  onSave: (user: User) => void;
  onClose: () => void;
}

function EditUserModal({ user, onSave, onClose }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'estudiante',
    is_active: user.is_active ?? true,
    telefono: user.telefono || '',
    ciudad: user.ciudad || '',
    pais: user.pais || '',
    departamento: user.departamento || '',
    tipo_documento: user.tipo_documento || '',
    numero_documento: user.numero_documento || '',
    fecha_nacimiento: user.fecha_nacimiento || '',
    genero: user.genero || '',
    barrio: user.barrio || '',
    direccion: user.direccion || '',
    ocupacion: user.ocupacion || '',
    empresa: user.empresa || '',
  });

  // Actualizar formData cuando cambie el usuario
  useEffect(() => {
    setFormData({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'estudiante',
      is_active: user.is_active ?? true,
      telefono: user.telefono || '',
      ciudad: user.ciudad || '',
      pais: user.pais || '',
      departamento: user.departamento || '',
      tipo_documento: user.tipo_documento || '',
      numero_documento: user.numero_documento || '',
      fecha_nacimiento: user.fecha_nacimiento || '',
      genero: user.genero || '',
      barrio: user.barrio || '',
      direccion: user.direccion || '',
      ocupacion: user.ocupacion || '',
      empresa: user.empresa || '',
    });
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...user, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Editar Usuario</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="estudiante">Estudiante</option>
                <option value="profesor">Profesor</option>
                <option value="superadmin">SuperAdmin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento
              </label>
              <select
                value={formData.tipo_documento}
                onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">Seleccionar...</option>
                <option value="cedula_identidad">Cédula de Identidad</option>
                <option value="pasaporte">Pasaporte</option>
                <option value="documento_extranjero">Documento Extranjero</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Documento
              </label>
              <input
                type="text"
                value={formData.numero_documento}
                onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                País
              </label>
              <input
                type="text"
                value={formData.pais}
                onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <input
                type="text"
                value={formData.departamento}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barrio/Zona
              </label>
              <input
                type="text"
                value={formData.barrio}
                onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={formData.fecha_nacimiento ? (formData.fecha_nacimiento.includes('T') ? formData.fecha_nacimiento.split('T')[0] : formData.fecha_nacimiento) : ''}
                onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Género
              </label>
              <select
                value={formData.genero}
                onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">Seleccionar...</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="prefiero_no_decir">Prefiero no decir</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ocupación
              </label>
              <input
                type="text"
                value={formData.ocupacion}
                onChange={(e) => setFormData({ ...formData, ocupacion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresa
              </label>
              <input
                type="text"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Usuario activo
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
