'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Info } from 'lucide-react';

export default function CompletarPerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    tipo_documento: '',
    numero_documento: '',
    fecha_nacimiento: '',
    genero: '',
    telefono: '',
    pais: '',
    departamento: '',
    ciudad: '',
    barrio: '',
    direccion: '',
    ocupacion: '',
    empresa: '',
  });

  const checkUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Prellenar el nombre si existe
        if (data.user.name) {
          setFormData(prev => ({ ...prev, name: data.user.name }));
        }
        
        // Si el perfil ya está completado, redirigir al dashboard
        if (data.user.profile_completed) {
          redirectToDashboard(data.user.role);
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const redirectToDashboard = (role: string) => {
    switch (role) {
      case 'superadmin':
        router.push('/dashboard_superadmin');
        break;
      case 'profesor':
        router.push('/dashboard_profesor');
        break;
      case 'estudiante':
        router.push('/dashboard_estudiante');
        break;
      default:
        router.push('/dashboard_estudiante');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert('Perfil completado exitosamente');
        redirectToDashboard(user.role);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      alert('Error al completar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl p-8 text-center border-b-4 border-primary">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 p-2">
            <Image
              src="/bitcan-logo.png"
              alt="BITCAN"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Completa tu Perfil
          </h1>
          <p className="text-gray-600">
            Necesitamos algunos datos adicionales para continuar
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Usuario: {user?.email}
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-b-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Personal */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm">1</span>
                Información Personal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Ej: Lic. Juan Pérez"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tipo_documento}
                    onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="cedula_identidad">Cédula de Identidad</option>
                    <option value="pasaporte">Pasaporte</option>
                    <option value="documento_extranjero">Documento Extranjero</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.numero_documento}
                    onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                    placeholder={formData.tipo_documento === 'cedula_identidad' ? 'Solo números' : 'Alfanumérico'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Género
                  </label>
                  <select
                    value={formData.genero}
                    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                    placeholder="+595 9XX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.pais}
                    onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  >
                    <option value="">Seleccionar país...</option>
                    <option value="Paraguay">Paraguay</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Brasil">Brasil</option>
                    <option value="Uruguay">Uruguay</option>
                    <option value="Bolivia">Bolivia</option>
                    <option value="Chile">Chile</option>
                    <option value="Perú">Perú</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Venezuela">Venezuela</option>
                    <option value="Ecuador">Ecuador</option>
                    <option value="México">México</option>
                    <option value="Estados Unidos">Estados Unidos</option>
                    <option value="España">España</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento/Estado <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.departamento}
                    onChange={(e) => setFormData({ ...formData, departamento: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barrio/Zona <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.barrio}
                    onChange={(e) => setFormData({ ...formData, barrio: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                    placeholder="Calle, número, entre calles..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Información Profesional */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center text-secondary text-sm">2</span>
                Información Profesional (Opcional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ocupación
                  </label>
                  <input
                    type="text"
                    value={formData.ocupacion}
                    onChange={(e) => setFormData({ ...formData, ocupacion: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-lg font-semibold text-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <LoadingSpinner />
                    Guardando...
                  </>
                ) : (
                  'Completar Perfil'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white text-sm">
          <p>Los campos marcados con * son obligatorios</p>
        </div>
      </div>
    </div>
  );
}

