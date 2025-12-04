'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Settings, 
  Globe, 
  Shield, 
  BookOpen, 
  Clock, 
  Users, 
  Database, 
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  Eye,
  Trash2
} from 'lucide-react';

interface SystemConfig {
  [key: string]: string;
}

interface SystemStats {
  total_users: number;
  total_courses: number;
  total_enrollments: number;
  total_lessons: number;
  total_certificates: number;
}

interface AuditLog {
  id: number;
  action: string;
  details: string;
  created_at: string;
  user_name: string;
}

export default function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({});
  const [stats, setStats] = useState<SystemStats>({
    total_users: 0,
    total_courses: 0,
    total_enrollments: 0,
    total_lessons: 0,
    total_certificates: 0
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const router = useRouter();

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      const [configResponse, statsResponse, logsResponse] = await Promise.all([
        fetch('/api/admin/settings/config'),
        fetch('/api/admin/settings/stats'),
        fetch('/api/admin/settings/audit-logs')
      ]);

      if (configResponse.ok) {
        const configData = await configResponse.json();
        setConfig(configData.config);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setAuditLogs(logsData.logs);
      }
    } catch (error) {
      console.error('Error loading system data:', error);
      setError('Error al cargar datos del sistema');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (configType: string, configData: any) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_type: configType, config: configData }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneralConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const configData = {
      system_name: formData.get('system_name') as string,
      system_timezone: formData.get('system_timezone') as string,
      system_language: formData.get('system_language') as string,
      system_description: formData.get('system_description') as string,
    };
    saveConfig('general_config', configData);
  };

  const handleSecurityConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const configData = {
      session_timeout: formData.get('session_timeout') as string,
      max_login_attempts: formData.get('max_login_attempts') as string,
      enable_audit_log: (formData.get('enable_audit_log') as string) || '0',
      require_email_verification: (formData.get('require_email_verification') as string) || '0',
      password_min_length: formData.get('password_min_length') as string,
      enable_two_factor: (formData.get('enable_two_factor') as string) || '0',
    };
    saveConfig('security_config', configData);
  };

  const handleCourseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const configData = {
      default_enrollment_days: formData.get('default_enrollment_days') as string,
      max_students_per_course: formData.get('max_students_per_course') as string,
      course_identifier_format: formData.get('course_identifier_format') as string,
      auto_approve_courses: (formData.get('auto_approve_courses') as string) || '0',
      require_course_approval: (formData.get('require_course_approval') as string) || '0',
    };
    saveConfig('course_config', configData);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'courses', label: 'Cursos', icon: BookOpen },
    { id: 'audit', label: 'Auditoría', icon: Eye },
    { id: 'stats', label: 'Estadísticas', icon: Database },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="w-8 h-8 text-gray-600" />
                Configuración del Sistema
              </h1>
              <p className="text-gray-600 mt-1">Administra la configuración general del sistema BITCAN</p>
            </div>
            <button
              onClick={loadSystemData}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Tabs de navegación */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-gray-700 text-gray-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab General */}
            {activeTab === 'general' && (
              <form onSubmit={handleGeneralConfig} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Sistema
                    </label>
                    <input
                      type="text"
                      name="system_name"
                      defaultValue={config.system_name || 'BITCAN'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zona Horaria
                    </label>
                    <select
                      name="system_timezone"
                      defaultValue={config.system_timezone || 'America/Asuncion'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="America/Asuncion">Paraguay (America/Asuncion)</option>
                      <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires)</option>
                      <option value="America/Sao_Paulo">Brasil (São Paulo)</option>
                      <option value="America/Montevideo">Uruguay (Montevideo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma del Sistema
                    </label>
                    <select
                      name="system_language"
                      defaultValue={config.system_language || 'es'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción del Sistema
                    </label>
                    <input
                      type="text"
                      name="system_description"
                      defaultValue={config.system_description || 'Plataforma de educación en ciberseguridad'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab Seguridad */}
            {activeTab === 'security' && (
              <form onSubmit={handleSecurityConfig} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo de Sesión (minutos)
                    </label>
                    <input
                      type="number"
                      name="session_timeout"
                      defaultValue={config.session_timeout || '60'}
                      min="5"
                      max="480"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo Intentos de Login
                    </label>
                    <input
                      type="number"
                      name="max_login_attempts"
                      defaultValue={config.max_login_attempts || '5'}
                      min="3"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitud Mínima de Contraseña
                    </label>
                    <input
                      type="number"
                      name="password_min_length"
                      defaultValue={config.password_min_length || '8'}
                      min="6"
                      max="20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="enable_audit_log"
                      value="1"
                      defaultChecked={config.enable_audit_log === '1'}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Habilitar Logs de Auditoría
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="require_email_verification"
                      value="1"
                      defaultChecked={config.require_email_verification === '1'}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Requerir Verificación de Email
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="enable_two_factor"
                      value="1"
                      defaultChecked={config.enable_two_factor === '1'}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Habilitar Autenticación de Dos Factores
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab Cursos */}
            {activeTab === 'courses' && (
              <form onSubmit={handleCourseConfig} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días por Defecto de Inscripción
                    </label>
                    <input
                      type="number"
                      name="default_enrollment_days"
                      defaultValue={config.default_enrollment_days || '30'}
                      min="1"
                      max="365"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo Estudiantes por Curso
                    </label>
                    <input
                      type="number"
                      name="max_students_per_course"
                      defaultValue={config.max_students_per_course || '50'}
                      min="1"
                      max="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formato de Identificador de Curso
                    </label>
                    <input
                      type="text"
                      name="course_identifier_format"
                      defaultValue={config.course_identifier_format || 'CURSO-{ID}'}
                      placeholder="Ej: CURSO-{ID}, {CATEGORY}-{ID}"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="auto_approve_courses"
                      value="1"
                      defaultChecked={config.auto_approve_courses === '1'}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Aprobar Cursos Automáticamente
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="require_course_approval"
                      value="1"
                      defaultChecked={config.require_course_approval === '1'}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Requerir Aprobación de Cursos
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab Auditoría */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Logs de Auditoría</h3>
                  <button
                    onClick={loadSystemData}
                    className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Actualizar
                  </button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {auditLogs.length > 0 ? (
                    <div className="space-y-3">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="bg-white p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-900">{log.action}</span>
                              <span className="text-gray-500 ml-2">por {log.user_name}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(log.created_at).toLocaleString('es-PY')}
                            </span>
                          </div>
                          {log.details && (
                            <div className="text-sm text-gray-600 mt-1">{log.details}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No hay logs de auditoría disponibles
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Estadísticas */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Estadísticas del Sistema</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <div className="text-2xl font-bold text-gray-900">{stats.total_users}</div>
                    <div className="text-sm text-gray-600">Usuarios</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <div className="text-2xl font-bold text-gray-900">{stats.total_courses}</div>
                    <div className="text-sm text-gray-600">Cursos</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <div className="text-2xl font-bold text-gray-900">{stats.total_enrollments}</div>
                    <div className="text-sm text-gray-600">Inscripciones</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Database className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <div className="text-2xl font-bold text-gray-900">{stats.total_lessons}</div>
                    <div className="text-sm text-gray-600">Lecciones</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <div className="text-2xl font-bold text-gray-900">{stats.total_certificates}</div>
                    <div className="text-sm text-gray-600">Certificados</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Información del Sistema</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Versión:</span>
                      <span className="ml-2 font-medium">1.0.0</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Última Actualización:</span>
                      <span className="ml-2 font-medium">
                        {new Date().toLocaleDateString('es-PY')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Zona Horaria:</span>
                      <span className="ml-2 font-medium">
                        {config.system_timezone || 'America/Asuncion'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Idioma:</span>
                      <span className="ml-2 font-medium">
                        {config.system_language || 'es'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}














