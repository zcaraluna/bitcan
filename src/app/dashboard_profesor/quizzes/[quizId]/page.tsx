'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  ArrowLeft,
  User,
  Mail,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  Edit
} from 'lucide-react';

interface Quiz {
  id: number;
  title: string;
  description?: string;
  course_title: string;
  course_id: number;
  passing_score: number;
}

interface QuizResult {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: number;
  time_taken_minutes?: number;
  completed_at: string;
  needs_manual_grading: number;
}

function QuizResultsContent() {
  const params = useParams();
  const router = useRouter();
  const quizId = Array.isArray(params.quizId) ? params.quizId[0] : (params.quizId as string);

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (quizId) {
      fetchData();
    } else {
      setError('ID de quiz no válido');
      setLoading(false);
    }
  }, [quizId]);

  const fetchData = async () => {
    if (!quizId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/professor/quizzes/${quizId}/results`);

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error al cargar los resultados');
        return;
      }

      const result = await response.json();
      if (result.success && result.data) {
        setQuiz(result.data.quiz || null);
        setResults(Array.isArray(result.data.results) ? result.data.results : []);
      } else {
        setError(result.error || 'Error al cargar los resultados');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar los resultados');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleString('es-ES');
    } catch (e) {
      return 'Fecha inválida';
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

  if (error && !quiz) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              Volver
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!quiz) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Resultados del Quiz</h1>
            <h2 className="text-xl text-gray-700 mt-1">{quiz.title}</h2>
            <p className="text-gray-600 mt-1">Curso: <strong>{quiz.course_title}</strong></p>
          </div>
          <button
            onClick={() => router.push(`/dashboard_profesor/quizzes/${quizId}/edit`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar Quiz
          </button>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">
              Estudiantes que completaron el quiz ({results.length})
            </h3>
          </div>
          
          {results.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg text-gray-600 mb-2">No hay resultados aún</h4>
              <p className="text-gray-500">Los estudiantes aparecerán aquí una vez que completen el quiz.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estudiante</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Puntaje</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Porcentaje</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tiempo</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Completado</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-900">{result.user_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{result.user_email}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {typeof result.score === 'number' ? result.score.toFixed(2) : result.score} / {result.max_score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                quiz && typeof result.percentage === 'number' && result.percentage >= quiz.passing_score
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(typeof result.percentage === 'number' ? result.percentage : 0, 100)}%` }}
                            />
                          </div>
                          <span className={`font-semibold ${
                            quiz && typeof result.percentage === 'number' && result.percentage >= quiz.passing_score
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {typeof result.percentage === 'number' ? result.percentage.toFixed(1) : result.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {result.needs_manual_grading ? (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3 h-3" />
                            Pendiente
                          </span>
                        ) : result.passed ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" />
                            Aprobado
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            Reprobado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {result.time_taken_minutes ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {result.time_taken_minutes} min
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(result.completed_at)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            if (quizId && result.user_id) {
                              router.push(`/dashboard_profesor/quizzes/${quizId}/students/${result.user_id}`);
                            }
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                          title="Ver Respuestas"
                          disabled={!quizId || !result.user_id}
                        >
                          <Eye className="w-4 h-4" />
                          Ver Respuestas
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
    </DashboardLayout>
  );
}

export default function QuizResultsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    }>
      <QuizResultsContent />
    </Suspense>
  );
}

