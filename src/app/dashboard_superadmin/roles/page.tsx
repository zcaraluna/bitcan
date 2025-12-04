'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Search, Filter, UserCheck, Shield, Users, UserX, Edit, AlertTriangle } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_completed: boolean;
  created_at: string;
  last_login: string;
  nombres?: string;
  apellidos?: string;
}

interface RoleStats {
  [key: string]: number;
}

interface SuperAdminEmail {
  id: number;
  email: string;
  created_at: string;
}

export default function ManageRoles() {
  const [users, setUsers] = useState<User[]>([]);
  const [superAdminEmails, setSuperAdminEmails] = useState<SuperAdminEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [roleStats, setRoleStats] = useState<RoleStats>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadUsers();
    loadSuperAdminEmails();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/roles/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setRoleStats(data.roleStats);
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

  const loadSuperAdminEmails = async () => {
    try {
      const response = await fetch('/api/admin/roles/superadmin-emails');
      if (response.ok) {
        const data = await response.json();
        setSuperAdminEmails(data.emails);
      }
    } catch (error) {
      console.error('Error loading super admin emails:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar búsqueda local o API
    const filteredUsers = users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.nombres && user.nombres.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.apellidos && user.apellidos.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = !roleFilter || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
    
    setUsers(filteredUsers);
  };

  const handleChangeRole = async (userId: number, newRole: string, reason: string) => {
    try {
      const response = await fetch('/api/admin/roles/change-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, new_role: newRole, reason }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setShowChangeRoleModal(false);
        setSelectedUser(null);
        loadUsers();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al cambiar rol');
      }
    } catch (error) {
      console.error('Error changing role:', error);
      setError('Error de conexión');
    }
  };

  const handleAddSuperAdminEmail = async (email: string) => {
    try {
      const response = await fetch('/api/admin/roles/superadmin-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess('Email de superadmin agregado exitosamente');
        setShowSuperAdminModal(false);
        loadSuperAdminEmails();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al agregar email');
      }
    } catch (error) {
      console.error('Error adding super admin email:', error);
      setError('Error de conexión');
    }
  };

  const handleRemoveSuperAdminEmail = async (emailId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este email de superadmin?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/roles/superadmin-emails', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_id: emailId }),
      });

      if (response.ok) {
        setSuccess('Email de superadmin eliminado exitosamente');
        loadSuperAdminEmails();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al eliminar email');
      }
    } catch (error) {
      console.error('Error removing super admin email:', error);
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Shield className="w-4 h-4" />;
      case 'profesor': return <UserCheck className="w-4 h-4" />;
      case 'estudiante': return <Users className="w-4 h-4" />;
      default: return <UserX className="w-4 h-4" />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.nombres && user.nombres.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.apellidos && user.apellidos.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-gray-600" />
                Gestionar Roles
              </h1>
              <p className="text-gray-600 mt-1">Administra roles y permisos de usuarios del sistema</p>
            </div>
            <button
              onClick={() => setShowSuperAdminModal(true)}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              Emails SuperAdmin
            </button>
          </div>

          {/* Estadísticas por rol */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(roleStats).map(([role, count]) => (
              <div key={role} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  {getRoleIcon(role)}
                  <span className={`ml-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(role)}`}>
                    {role}
                  </span>
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
                placeholder="Nombre, email, documento..."
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
                onClick={() => { setSearchTerm(''); setRoleFilter(''); loadUsers(); }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>
          </form>
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

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
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
                  {filteredUsers.map((user) => (
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
                            {(user.nombres || user.apellidos) && (
                              <div className="text-xs text-gray-400">
                                {user.nombres} {user.apellidos}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{user.role}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          user.profile_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.profile_completed ? 'Perfil Completo' : 'Perfil Incompleto'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('es-PY')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => { setSelectedUser(user); setShowChangeRoleModal(true); }}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          title="Cambiar rol"
                        >
                          <Edit className="w-4 h-4" />
                          Cambiar Rol
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de cambio de rol */}
      {showChangeRoleModal && selectedUser && (
        <ChangeRoleModal
          user={selectedUser}
          onSave={handleChangeRole}
          onClose={() => {
            setShowChangeRoleModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Modal de emails superadmin */}
      {showSuperAdminModal && (
        <SuperAdminEmailsModal
          emails={superAdminEmails}
          onAdd={handleAddSuperAdminEmail}
          onRemove={handleRemoveSuperAdminEmail}
          onClose={() => setShowSuperAdminModal(false)}
        />
      )}
    </DashboardLayout>
  );
}

// Componente Modal de Cambio de Rol
interface ChangeRoleModalProps {
  user: User;
  onSave: (userId: number, newRole: string, reason: string) => void;
  onClose: () => void;
}

function ChangeRoleModal({ user, onSave, onClose }: ChangeRoleModalProps) {
  const [newRole, setNewRole] = useState(user.role);
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRole !== user.role) {
      onSave(user.id, newRole, reason || 'Cambio de rol desde dashboard');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Cambiar Rol de Usuario</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">{user.name}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-sm text-gray-500">Rol actual: <span className="font-medium">{user.role}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuevo Rol
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            >
              <option value="estudiante">Estudiante</option>
              <option value="profesor">Profesor</option>
              <option value="superadmin">SuperAdmin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razón del cambio (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Explica por qué se cambia el rol..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>

          {newRole !== user.role && (
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                Se registrará este cambio en el historial de auditoría.
              </span>
            </div>
          )}

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
              disabled={newRole === user.role}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cambiar Rol
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente Modal de Emails SuperAdmin
interface SuperAdminEmailsModalProps {
  emails: SuperAdminEmail[];
  onAdd: (email: string) => void;
  onRemove: (emailId: number) => void;
  onClose: () => void;
}

function SuperAdminEmailsModal({ emails, onAdd, onRemove, onClose }: SuperAdminEmailsModalProps) {
  const [newEmail, setNewEmail] = useState('');

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail.trim()) {
      onAdd(newEmail.trim());
      setNewEmail('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Emails de SuperAdmin</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Los emails configurados aquí tendrán permisos de superadmin automáticamente.
          </p>

          <form onSubmit={handleAddEmail} className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
            >
              Agregar
            </button>
          </form>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {emails.map((email) => (
            <div key={email.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{email.email}</div>
                <div className="text-sm text-gray-500">
                  Agregado: {new Date(email.created_at).toLocaleDateString('es-PY')}
                </div>
              </div>
              <button
                onClick={() => onRemove(email.id)}
                className="text-red-600 hover:text-red-800"
                title="Eliminar email"
              >
                <UserX className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}














