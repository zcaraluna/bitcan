'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { User, Save, Info } from 'lucide-react';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  tipo_documento?: string;
  numero_documento?: string;
  fecha_nacimiento?: string;
  genero?: string;
  telefono?: string;
  pais?: string;
  departamento?: string;
  ciudad?: string;
  barrio?: string;
  direccion?: string;
  ocupacion?: string;
  empresa?: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setProfile({
          id: data.user.id,
          name: data.user.name || '',
          email: data.user.email || '',
          tipo_documento: data.user.tipo_documento || '',
          numero_documento: data.user.numero_documento || '',
          fecha_nacimiento: data.user.fecha_nacimiento 
            ? (data.user.fecha_nacimiento.includes('T') 
                ? data.user.fecha_nacimiento.split('T')[0] 
                : data.user.fecha_nacimiento)
            : '',
          genero: data.user.genero || '',
          telefono: data.user.telefono || '',
          pais: data.user.pais || '',
          departamento: data.user.departamento || '',
          ciudad: data.user.ciudad || '',
          barrio: data.user.barrio || '',
          direccion: data.user.direccion || '',
          ocupacion: data.user.ocupacion || '',
          empresa: data.user.empresa || '',
        });
      } else {
        setError('Error al cargar el perfil');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          tipo_documento: profile.tipo_documento,
          numero_documento: profile.numero_documento,
          fecha_nacimiento: profile.fecha_nacimiento,
          genero: profile.genero,
          telefono: profile.telefono,
          pais: profile.pais,
          departamento: profile.departamento,
          ciudad: profile.ciudad,
          barrio: profile.barrio,
          direccion: profile.direccion,
          ocupacion: profile.ocupacion,
          empresa: profile.empresa,
        }),
      });

      if (response.ok) {
        setSuccess('Perfil actualizado correctamente');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Error al guardar el perfil');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Error al guardar el perfil');
    } finally {
      setSaving(false);
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

  if (error && !profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchProfile}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600">Actualiza tu información personal</p>
            </div>
          </div>
        </div>

        {/* Mensajes de éxito/error */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-6">
            {/* Información Básica */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <span>Nombre Completo <span className="text-red-500">*</span></span>
                      <div className="group relative">
                        <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                          Puedes incluir tu título profesional si lo deseas, por ejemplo: &quot;Lic. Juan Pérez&quot; o &quot;Ing. María González&quot;
                        </div>
                      </div>
                    </div>
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Ej: Lic. Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">El correo no puede ser modificado</p>
                </div>
              </div>
            </div>

            {/* Información Personal */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento
                  </label>
                  <select
                    value={profile.tipo_documento || ''}
                    onChange={(e) => setProfile({ ...profile, tipo_documento: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="cedula_identidad">Cédula de Identidad</option>
                    <option value="pasaporte">Pasaporte</option>
                    <option value="documento_extranjero">Documento Extranjero</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Documento
                  </label>
                  <input
                    type="text"
                    value={profile.numero_documento || ''}
                    onChange={(e) => setProfile({ ...profile, numero_documento: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={profile.fecha_nacimiento || ''}
                    onChange={(e) => setProfile({ ...profile, fecha_nacimiento: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Género
                  </label>
                  <select
                    value={profile.genero || ''}
                    onChange={(e) => setProfile({ ...profile, genero: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="prefiero_no_decir">Prefiero no decir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={profile.telefono || ''}
                    onChange={(e) => setProfile({ ...profile, telefono: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Información de Ubicación */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Ubicación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    value={profile.pais || ''}
                    onChange={(e) => setProfile({ ...profile, pais: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={profile.departamento || ''}
                    onChange={(e) => setProfile({ ...profile, departamento: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={profile.ciudad || ''}
                    onChange={(e) => setProfile({ ...profile, ciudad: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barrio
                  </label>
                  <input
                    type="text"
                    value={profile.barrio || ''}
                    onChange={(e) => setProfile({ ...profile, barrio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={profile.direccion || ''}
                    onChange={(e) => setProfile({ ...profile, direccion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Información Profesional */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Profesional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ocupación
                  </label>
                  <input
                    type="text"
                    value={profile.ocupacion || ''}
                    onChange={(e) => setProfile({ ...profile, ocupacion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={profile.empresa || ''}
                    onChange={(e) => setProfile({ ...profile, empresa: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

