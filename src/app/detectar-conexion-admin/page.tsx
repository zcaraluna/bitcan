'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users,
  Eye,
  User,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface Connection {
  id: number;
  session_id: string;
  user_id: number | null;
  ip_address: string;
  isp: string | null;
  organization: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  is_vpn: number;
  is_proxy: number;
  is_tor: number;
  latitude: number | null;
  longitude: number | null;
  user_agent: string | null;
  connected_at: string;
  last_activity: string;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
}

export default function DetectarConexionAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProfessor, setIsProfessor] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Obtener sessionId actual
  useEffect(() => {
    const sid = localStorage.getItem('network_session_id');
    setCurrentSessionId(sid);
  }, []);

  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);
      setError(null);
      
      // Incluir sessionId en la URL para excluir la propia conexión
      const url = currentSessionId 
        ? `/api/network/connections?exclude_session_id=${encodeURIComponent(currentSessionId)}`
        : '/api/network/connections';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('No tienes permisos para ver las conexiones');
          return;
        }
        throw new Error('Error al obtener conexiones');
      }

      const result = await response.json();
      if (result.success) {
        // Filtrar también en el frontend como medida adicional
        const filtered = (result.data || []).filter((conn: Connection) => {
          return conn.session_id !== currentSessionId;
        });
        setConnections(filtered);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      setError('Error al obtener las conexiones');
    } finally {
      setLoadingConnections(false);
    }
  };

  // Verificar si es profesor y cargar conexiones
  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user?.role === 'profesor') {
            setIsProfessor(true);
            // Esperar a que currentSessionId esté disponible antes de cargar
            if (currentSessionId) {
              fetchConnections();
            }
          } else {
            setError('Acceso denegado. Solo profesores pueden acceder a esta página.');
          }
        } else {
          setError('Debes estar autenticado como profesor para acceder a esta página.');
        }
      } catch (error) {
        setError('Error al verificar permisos');
      } finally {
        setLoading(false);
      }
    };
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId]);

  // Auto-refresh cada 10 segundos
  useEffect(() => {
    if (!isProfessor || !currentSessionId) return;
    
    const interval = setInterval(() => {
      fetchConnections();
    }, 10000);

    return () => clearInterval(interval);
  }, [isProfessor, currentSessionId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !isProfessor) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Ir a Login
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Administración de Conexiones</h1>
            <p className="text-gray-600 mt-1">
              Lista de personas conectadas al detector de conexión
            </p>
          </div>
          <button
            onClick={fetchConnections}
            disabled={loadingConnections}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loadingConnections ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Lista de Conexiones */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Conexiones Activas</h2>
              <p className="text-sm text-gray-500">
                {connections.length} {connections.length === 1 ? 'persona conectada' : 'personas conectadas'}
              </p>
            </div>
          </div>

          {loadingConnections ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : connections.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay conexiones activas</p>
          ) : (
            <div className="space-y-2">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setSelectedConnection(conn)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {conn.user_name || 'Usuario Anónimo'}
                        </p>
                        {conn.user_email && (
                          <span className="text-sm text-gray-500">({conn.user_email})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{conn.ip_address}</span>
                        {conn.country && <span>• {conn.country}</span>}
                        {conn.city && <span>• {conn.city}</span>}
                        {(conn.is_vpn || conn.is_proxy || conn.is_tor) && (
                          <span className="text-yellow-600 font-medium">• VPN/Proxy</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalles de Conexión */}
      {selectedConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Detalles de Conexión</h2>
              <button
                onClick={() => setSelectedConnection(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Información del Usuario */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Usuario</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Nombre</p>
                    <p className="font-semibold text-gray-900">
                      {selectedConnection.user_name || 'Usuario Anónimo'}
                    </p>
                  </div>
                  {selectedConnection.user_email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold text-gray-900">{selectedConnection.user_email}</p>
                    </div>
                  )}
                  {selectedConnection.user_role && (
                    <div>
                      <p className="text-sm text-gray-500">Rol</p>
                      <p className="font-semibold text-gray-900 capitalize">{selectedConnection.user_role}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de Red */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Información de Red</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">IP Address</p>
                    <p className="font-mono font-semibold text-gray-900">{selectedConnection.ip_address}</p>
                  </div>
                  {selectedConnection.isp && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">ISP</p>
                      <p className="font-semibold text-gray-900">{selectedConnection.isp}</p>
                    </div>
                  )}
                  {selectedConnection.organization && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Organización</p>
                      <p className="font-semibold text-gray-900">{selectedConnection.organization}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ubicación */}
              {(selectedConnection.country || selectedConnection.city) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Ubicación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedConnection.country && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">País</p>
                        <p className="font-semibold text-gray-900">{selectedConnection.country}</p>
                      </div>
                    )}
                    {selectedConnection.region && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Región</p>
                        <p className="font-semibold text-gray-900">{selectedConnection.region}</p>
                      </div>
                    )}
                    {selectedConnection.city && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Ciudad</p>
                        <p className="font-semibold text-gray-900">{selectedConnection.city}</p>
                      </div>
                    )}
                  </div>
                  {selectedConnection.latitude && selectedConnection.longitude && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-1">Coordenadas</p>
                      <p className="font-mono text-sm text-gray-700">
                        {selectedConnection.latitude.toFixed(4)}, {selectedConnection.longitude.toFixed(4)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Seguridad */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Estado de Seguridad</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">VPN</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedConnection.is_vpn 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedConnection.is_vpn ? 'Sí' : 'No'}
                    </span>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Proxy</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedConnection.is_proxy 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedConnection.is_proxy ? 'Sí' : 'No'}
                    </span>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Tor</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedConnection.is_tor 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedConnection.is_tor ? 'Sí' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información Técnica */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Información Técnica</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Session ID</p>
                    <p className="font-mono text-xs text-gray-700 break-all">{selectedConnection.session_id}</p>
                  </div>
                  {selectedConnection.user_agent && (
                    <div>
                      <p className="text-sm text-gray-500">User Agent</p>
                      <p className="font-mono text-xs text-gray-700 break-all">{selectedConnection.user_agent}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Conectado desde</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedConnection.connected_at).toLocaleString('es-PY')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Última actividad</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedConnection.last_activity).toLocaleString('es-PY')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

