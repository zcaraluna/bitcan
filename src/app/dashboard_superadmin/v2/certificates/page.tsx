'use client';

/**
 * Página principal de gestión de certificados V2
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import CertificateListV2 from '@/components/certificates/CertificateListV2';
import { CertificateStats } from '@/types/certificates';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CertificatesV2Page() {
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'issued' | 'revoked'>('all');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/certificates/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Certificados
            </h1>
            <p className="text-gray-600">
              Sistema moderno de certificados con Puppeteer
            </p>
          </div>
          
          <div className="flex gap-3">
            <a
              href="/dashboard_superadmin/v2/certificates/templates"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              Gestionar Plantillas
            </a>
            <a
              href="/dashboard_superadmin/v2/certificates/verify"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Verificar Certificados
            </a>
            <a
              href="/dashboard_superadmin/courses"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Generar Certificados
            </a>
          </div>
        </div>

        {/* Estadísticas */}
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-gray-600 text-sm mb-1">Total Emitidos</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.total_issued.toLocaleString('es-PY')}
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-gray-600 text-sm mb-1">Activos</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.total_active.toLocaleString('es-PY')}
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-gray-600 text-sm mb-1">Revocados</p>
              <p className="text-3xl font-bold text-red-600">
                {stats.total_revoked.toLocaleString('es-PY')}
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-gray-600 text-sm mb-1">Por Curso</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.by_course.length}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveTab('issued')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'issued'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Emitidos
            </button>
            <button
              onClick={() => setActiveTab('revoked')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'revoked'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Revocados
            </button>
          </div>
        </div>

        {/* Lista de certificados */}
        <CertificateListV2
          filters={{
            status: activeTab === 'all' ? undefined : (activeTab as any),
          }}
        />
      </div>
    </DashboardLayout>
  );
}

