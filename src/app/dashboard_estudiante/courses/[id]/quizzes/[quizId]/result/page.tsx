'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  AlertCircle,
  FileText
} from 'lucide-react';

interface QuizOption {
  id: number;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
}

interface QuizQuestion {
  id: number;
  question: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'text';
  points: number;
  sort_order: number;
  require_justification?: boolean;
  file_path?: string;
  options: QuizOption[];
}

interface QuizResult {
  id: number;
  score: number;
  max_score: number;
  auto_score: number;
  passed: boolean;
  percentage: number;
  completed_at: string;
  time_taken_minutes: number;
  needs_manual_grading: boolean;
}

interface Quiz {
  id: number;
  title: string;
  description?: string;
  passing_score: number;
  course_title: string;
  course_id: number;
}

interface ResultData {
  quiz: Quiz;
  result: QuizResult;
  questions?: QuizQuestion[];
  student_answers?: Record<number, any>;
  results_published?: boolean;
  publish_datetime?: string;
}

export default function QuizResultPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const quizId = params.quizId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResult();
  }, [courseId, quizId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/courses/${courseId}/quizzes/${quizId}/result`);

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Error al cargar el resultado');
        return;
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError('Error al cargar el resultado');
      }
    } catch (error) {
      console.error('Error fetching result:', error);
      setError('Error al cargar el resultado');
    } finally {
      setLoading(false);
    }
  };

  const isAnswerCorrect = (question: QuizQuestion, studentAnswer: any): boolean => {
    if (!studentAnswer) return false;

    switch (question.question_type) {
      case 'single_choice':
      case 'multiple_choice':
        const selectedOptionId = Array.isArray(studentAnswer) ? studentAnswer[0] : studentAnswer;
        const selectedOption = question.options.find(opt => opt.id === parseInt(selectedOptionId));
        return selectedOption ? selectedOption.is_correct : false;

      case 'true_false':
        const answer = studentAnswer.answer || studentAnswer;
        const correctOption = question.options.find(opt => opt.is_correct);
        return correctOption ? correctOption.option_text === answer : false;

      case 'text':
        return false; // Las preguntas de texto requieren calificación manual
    }
    return false;
  };

  const getQuestionPoints = (question: QuizQuestion, studentAnswer: any): number => {
    if (isAnswerCorrect(question, studentAnswer)) {
      return parseFloat(question.points.toString());
    }
    return 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-PY');
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

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || 'Error desconocido'}</p>
            <button
              onClick={() => router.push(`/dashboard_estudiante/courses/${courseId}`)}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              Volver al Curso
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { quiz, result, questions, student_answers, results_published, publish_datetime } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard_estudiante/courses/${courseId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Resultado del Quiz</h1>
            <p className="text-gray-600 mt-1">{quiz.title} - {quiz.course_title}</p>
          </div>
        </div>

        {/* Resumen del Resultado */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ${
                result.passed 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                {result.percentage}%
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {result.passed ? 'Aprobado' : 'No Aprobado'}
                </h2>
                <p className="text-gray-600">
                  Puntaje: {result.score} / {result.max_score} puntos
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Puntaje mínimo requerido: {quiz.passing_score}%
                </p>
              </div>
            </div>
            <div className="text-right">
              {result.passed ? (
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              ) : (
                <XCircle className="w-12 h-12 text-red-600" />
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Tiempo utilizado</div>
                <div className="font-semibold text-gray-900">
                  {result.time_taken_minutes || 0} minutos
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Completado el</div>
                <div className="font-semibold text-gray-900">
                  {formatDate(result.completed_at)}
                </div>
              </div>
            </div>
            {result.needs_manual_grading && (
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-sm text-gray-500">Estado</div>
                  <div className="font-semibold text-yellow-600">
                    Pendiente calificación manual
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mensaje si los resultados no están publicados */}
        {!results_published && publish_datetime && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Resultados Parciales</h3>
                <p className="text-blue-800">
                  Los resultados completos con respuestas correctas y explicaciones estarán disponibles el{' '}
                  <strong>{new Date(publish_datetime).toLocaleString('es-PY')}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Preguntas y Respuestas - Solo mostrar si están publicados */}
        {results_published && questions && student_answers && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Revisión de Respuestas</h2>
            
            {questions.map((question, index) => {
            const studentAnswer = student_answers[question.id];
            const isCorrect = isAnswerCorrect(question, studentAnswer);
            const pointsEarned = getQuestionPoints(question, studentAnswer);

            return (
              <div
                key={question.id}
                className={`bg-white rounded-xl border-2 p-6 ${
                  question.question_type === 'text' || (Boolean(question.require_justification) && studentAnswer?.justification)
                    ? 'border-yellow-300 bg-yellow-50'
                    : isCorrect
                    ? 'border-green-300 bg-green-50'
                    : 'border-red-300 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      question.question_type === 'text' || (Boolean(question.require_justification) && studentAnswer?.justification)
                        ? 'bg-yellow-100 text-yellow-800'
                        : isCorrect
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {question.question}
                      </h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          Puntos: {pointsEarned} / {question.points}
                        </span>
                        {question.question_type === 'text' || (Boolean(question.require_justification) && studentAnswer?.justification) ? (
                          <span className="text-yellow-600 font-medium">
                            Requiere calificación manual
                          </span>
                        ) : isCorrect ? (
                          <span className="text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Correcta
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            Incorrecta
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mostrar opciones y respuestas */}
                {question.question_type !== 'text' && question.options && question.options.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {question.options
                      .filter((option) => {
                        // Filtrar opciones vacías o que solo contengan "0"
                        const text = option.option_text?.trim() || '';
                        return text !== '' && text !== '0';
                      })
                      .map((option) => {
                        const isSelected = question.question_type === 'single_choice' || question.question_type === 'multiple_choice'
                          ? studentAnswer === option.id.toString() || (Array.isArray(studentAnswer) && studentAnswer.includes(option.id.toString()))
                          : (studentAnswer?.answer || studentAnswer) === option.option_text;

                        return (
                          <div
                            key={option.id}
                            className={`p-3 rounded-lg border-2 ${
                              Boolean(option.is_correct)
                                ? 'bg-green-100 border-green-300'
                                : isSelected
                                ? 'bg-red-100 border-red-300'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {Boolean(option.is_correct) ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                              ) : null}
                              {isSelected && !Boolean(option.is_correct) ? (
                                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                              ) : null}
                              <span className={Boolean(option.is_correct) ? 'font-semibold text-green-800' : isSelected ? 'font-semibold text-red-800' : 'text-gray-700'}>
                                {option.option_text}
                              </span>
                              {Boolean(option.is_correct) ? (
                                <span className="ml-auto text-xs text-green-600 font-medium">
                                  Respuesta correcta
                                </span>
                              ) : null}
                              {isSelected && !Boolean(option.is_correct) ? (
                                <span className="ml-auto text-xs text-red-600 font-medium">
                                  Tu respuesta
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Mostrar justificación si existe */}
                {Boolean(question.require_justification) && studentAnswer?.justification ? (
                  <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800 mb-1">Tu justificación:</div>
                    <div className="text-yellow-900">{studentAnswer.justification}</div>
                  </div>
                ) : null}

                {/* Mostrar respuesta de texto si existe */}
                {question.question_type === 'text' && studentAnswer && (
                  <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800 mb-1">Tu respuesta:</div>
                    <div className="text-yellow-900 whitespace-pre-wrap">{studentAnswer}</div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

