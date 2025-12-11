'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
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
  Clock
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

export default function DetectarConexionPage() {
  const [loading, setLoading] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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

  useEffect(() => {
    fetchNetworkInfo();
  }, []);

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
    <DashboardLayout>
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

            {/* Información Adicional */}
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
    </DashboardLayout>
  );
}

