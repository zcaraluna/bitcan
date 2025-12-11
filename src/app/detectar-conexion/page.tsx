'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Globe, 
  MapPin, 
  Building2, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Wifi,
  Server,
  Clock,
  Users,
  Eye,
  User,
  X
} from 'lucide-react';

interface NetworkInfo {
  ip: string;
  isp?: string;
  organization?: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  isp_type?: string;
  is_vpn?: boolean;
  is_proxy?: boolean;
  is_tor?: boolean;
  latitude?: number;
  longitude?: number;
}

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

export default function DetectarConexionPage() {
  const [loading, setLoading] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProfessor, setIsProfessor] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Generar o recuperar sessionId
  useEffect(() => {
    let sid = localStorage.getItem('network_session_id');
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('network_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  // Verificar si es profesor
  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user?.role === 'profesor') {
            setIsProfessor(true);
            fetchConnections();
          }
        }
      } catch (error) {
        // No autenticado, no es problema
      }
    };
    checkUser();
  }, []);

  const fetchNetworkInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/network/detect');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al detectar la conexión');
      }

      const result = await response.json();
      
      if (result.success) {
        setNetworkInfo(result.data);
        setLastUpdate(new Date());
        
        // Registrar conexión
        if (sessionId) {
          await registerConnection(result.data);
        }
      } else {
        throw new Error(result.error || 'Error al obtener información de red');
      }
    } catch (err: any) {
      console.error('Error fetching network info:', err);
      setError(err.message || 'Error al detectar la conexión');
    } finally {
      setLoading(false);
    }
  };

  const registerConnection = async (info: NetworkInfo) => {
    if (!sessionId) return;
    
    try {
      await fetch('/api/network/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          networkInfo: info
        })
      });
    } catch (error) {
      console.error('Error registering connection:', error);
    }
  };

  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);
      const response = await fetch('/api/network/connections');
      
      if (!response.ok) {
        throw new Error('Error al obtener conexiones');
      }

      const result = await response.json();
      if (result.success) {
        setConnections(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchNetworkInfo();
    }
  }, [sessionId]);

  // Auto-refresh de conexiones cada 10 segundos si es profesor
  useEffect(() => {
    if (!isProfessor) return;
    
    const interval = setInterval(() => {
      fetchConnections();
    }, 10000);

    return () => clearInterval(interval);
  }, [isProfessor]);

  const getSecurityStatus = () => {
    if (!networkInfo) return null;
    
    if (networkInfo.is_vpn || networkInfo.is_proxy || networkInfo.is_tor) {
      return {
        type: 'warning',
        icon: AlertTriangle,
        message: 'Conexión detectada a través de VPN/Proxy/Tor',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    }
    
    return {
      type: 'success',
      icon: CheckCircle2,
      message: 'Conexión directa detectada',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  };

  const securityStatus = getSecurityStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detector de Conexión</h1>
              <p className="text-gray-600 mt-1">
                Información sobre tu conexión de red, IP e ISP
              </p>
            </div>
            <button
              onClick={fetchNetworkInfo}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {/* Lista de Conexiones (Solo para Profesores) */}
          {isProfessor && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
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
                <button
                  onClick={fetchConnections}
                  disabled={loadingConnections}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingConnections ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
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
          )}

          {loading && !networkInfo && (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {networkInfo && (
            <div className="space-y-6">
              {/* Estado de Seguridad */}
              {securityStatus && (
                <div className={`${securityStatus.bgColor} border ${securityStatus.borderColor} rounded-xl p-6`}>
                  <div className="flex items-center gap-4">
                    <securityStatus.icon className={`w-8 h-8 ${securityStatus.color}`} />
                    <div className="flex-1">
                      <h3 className={`font-semibold ${securityStatus.color} mb-1`}>
                        Estado de Conexión
                      </h3>
                      <p className="text-gray-700">{securityStatus.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Información Principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* IP Address */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Server className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Dirección IP</h3>
                      <p className="text-2xl font-bold text-gray-900">{networkInfo.ip}</p>
                    </div>
                  </div>
                </div>

                {/* ISP */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Proveedor de Internet (ISP)</h3>
                      <p className="text-xl font-semibold text-gray-900">{networkInfo.isp || 'No disponible'}</p>
                    </div>
                  </div>
                </div>

                {/* Organización */}
                {networkInfo.organization && networkInfo.organization !== 'No disponible' && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Wifi className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Organización</h3>
                        <p className="text-lg font-semibold text-gray-900">{networkInfo.organization}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tipo de ISP */}
                {networkInfo.isp_type && networkInfo.isp_type !== 'No disponible' && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Globe className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Tipo de ISP (ASN)</h3>
                        <p className="text-sm font-mono text-gray-700 break-all">{networkInfo.isp_type}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ubicación */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Ubicación Aproximada</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">País</p>
                    <p className="text-lg font-semibold text-gray-900">{networkInfo.country || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Región</p>
                    <p className="text-lg font-semibold text-gray-900">{networkInfo.region || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ciudad</p>
                    <p className="text-lg font-semibold text-gray-900">{networkInfo.city || 'No disponible'}</p>
                  </div>
                </div>
                {networkInfo.latitude && networkInfo.longitude && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Coordenadas</p>
                    <p className="text-sm font-mono text-gray-700">
                      Lat: {networkInfo.latitude.toFixed(4)}, Lon: {networkInfo.longitude.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>

              {/* Información de Seguridad */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Shield className="w-6 h-6 text-gray-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Información de Seguridad</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">VPN</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      networkInfo.is_vpn 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {networkInfo.is_vpn ? 'Detectado' : 'No detectado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Proxy</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      networkInfo.is_proxy 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {networkInfo.is_proxy ? 'Detectado' : 'No detectado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Tor</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      networkInfo.is_tor 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {networkInfo.is_tor ? 'Detectado' : 'No detectado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Zona Horaria */}
              {networkInfo.timezone && networkInfo.timezone !== 'No disponible' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Clock className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Zona Horaria</h3>
                      <p className="text-lg font-semibold text-gray-900">{networkInfo.timezone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Última actualización */}
              {lastUpdate && (
                <div className="text-center text-sm text-gray-500">
                  Última actualización: {lastUpdate.toLocaleString('es-PY', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
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
    </div>
  );
}
