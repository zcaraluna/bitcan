'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  ArrowLeft,
  Clock,
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PendingResult {
  result_id: number;
  quiz_id: number;
  user_id: number;
  score: number;
  max_score: number;
  completed_at: string;
  quiz_title: string;
  quiz_description?: string;
  course_id: number;
  course_title: string;
  student_name: string;
  student_email: string;
}

export default function PendingQuizResultsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingResults, setPendingResults] = useState<PendingResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPendingResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/professor/quizzes/pending');

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Error al cargar los resultados pendientes' }));
        setError(data.error || 'Error al cargar los resultados pendientes');
        setPendingResults([]);
        return;
      }

      const result = await response.json().catch(() => ({ success: false }));
      if (result.success && result.data && Array.isArray(result.data)) {
        // Validar que cada resultado tenga los campos necesarios
        const validResults = result.data.filter((r: any) => 
          r && typeof r.result_id === 'number' && typeof r.quiz_id === 'number' && typeof r.user_id === 'number'
        );
        setPendingResults(validResults);
      } else {
        setError(result.error || 'Error al cargar los resultados pendientes');
        setPendingResults([]);
      }
    } catch (error) {
      console.error('Error fetching pending results:', error);
      setError('Error al cargar los resultados pendientes');
      setPendingResults([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  const calculatePercentage = (score: number, maxScore: number) => {
    if (typeof maxScore !== 'number' || !maxScore || maxScore === 0) return 0;
    if (typeof score !== 'number' || (score !== 0 && !score)) return 0;
    return Math.round((score / maxScore) * 100 * 10) / 10;
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard_profesor')}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              Volver al Dashboard
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard_profesor')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Calificaciones Pendientes</h1>
            <p className="text-gray-600 mt-1">
              Resultados de quizzes que requieren calificación manual
            </p>
          </div>
        </div>

        {/* Results List */}
        {pendingResults.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No hay calificaciones pendientes
            </h2>
            <p className="text-gray-600 mb-6">
              Todos los resultados han sido calificados.
            </p>
            <button
              onClick={() => router.push('/dashboard_profesor')}
              className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-2 rounded-lg"
            >
              Volver al Dashboard
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Estudiante
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Quiz
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Curso
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Puntaje
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Completado
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingResults.map((result) => (
                    <tr key={`${result.result_id}-${result.quiz_id}-${result.user_id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{result.student_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{result.student_email || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{result.quiz_title || 'N/A'}</div>
                          {result.quiz_description && (
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {result.quiz_description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{result.course_title || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {typeof result.score === 'number' ? result.score.toFixed(1) : (result.score ?? 0)} / {typeof result.max_score === 'number' ? result.max_score.toFixed(1) : (result.max_score ?? 0)}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({calculatePercentage(typeof result.score === 'number' ? result.score : 0, typeof result.max_score === 'number' ? result.max_score : 0)}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {result.completed_at ? formatDate(result.completed_at) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {result.quiz_id && result.user_id ? (
                          <button
                            onClick={() => {
                              if (result.quiz_id && result.user_id) {
                                router.push(`/dashboard_profesor/quizzes/${result.quiz_id}/students/${result.user_id}`);
                              }
                            }}
                            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            disabled={!result.quiz_id || !result.user_id}
                          >
                            <Eye className="w-4 h-4" />
                            Calificar
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

