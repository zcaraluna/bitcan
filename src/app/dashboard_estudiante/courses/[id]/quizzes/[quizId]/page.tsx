'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Clock, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send
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

interface Quiz {
  id: number;
  title: string;
  description?: string;
  time_limit_minutes?: number;
  passing_score: number;
  course_title: string;
  course_id: number;
}

interface QuizData {
  quiz: Quiz;
  questions: QuizQuestion[];
}

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const quizId = params.quizId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<QuizData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchQuizData();
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [courseId, quizId]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/courses/${courseId}/quizzes/${quizId}`);

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.completed) {
          router.push(`/dashboard_estudiante/courses/${courseId}/quizzes/${quizId}/result`);
          return;
        }
        setError(errorData.error || 'Error al cargar el quiz');
        return;
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
        
        // Cargar respuestas guardadas si existen
        const savedAnswers = localStorage.getItem(`quiz_${quizId}_answers`);
        if (savedAnswers) {
          try {
            setAnswers(JSON.parse(savedAnswers));
          } catch (e) {
            console.error('Error parsing saved answers:', e);
          }
        }
        
        // Iniciar timer si hay límite de tiempo
        if (result.data.quiz.time_limit_minutes) {
          const minutes = result.data.quiz.time_limit_minutes;
          const totalSeconds = minutes * 60;
          const storageKey = `quiz_${quizId}_start_time`;
          
          // Verificar si hay un tiempo de inicio guardado
          const savedStartTime = localStorage.getItem(storageKey);
          let actualStartTime: number;
          let elapsedSeconds = 0;
          
          if (savedStartTime) {
            // Hay un tiempo guardado, calcular el tiempo transcurrido
            actualStartTime = parseInt(savedStartTime);
            elapsedSeconds = Math.floor((Date.now() - actualStartTime) / 1000);
          } else {
            // Primera vez, guardar el tiempo de inicio
            actualStartTime = Date.now();
            localStorage.setItem(storageKey, actualStartTime.toString());
          }
          
          // Calcular tiempo restante
          const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
          
          setTimeRemaining(remainingSeconds);
          setStartTime(actualStartTime);
          
          // Si el tiempo ya expiró, enviar automáticamente
          if (remainingSeconds <= 0) {
            handleTimeExpired();
            return;
          }
          
          // Iniciar countdown
          timerIntervalRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
              if (prev === null || prev <= 1) {
                if (timerIntervalRef.current) {
                  clearInterval(timerIntervalRef.current);
                }
                localStorage.removeItem(storageKey);
                localStorage.removeItem(`quiz_${quizId}_answers`);
                handleTimeExpired();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else {
        setError('Error al cargar el quiz');
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError('Error al cargar el quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeExpired = async () => {
    // Enviar quiz automáticamente cuando expire el tiempo
    if (Object.keys(answers).length > 0) {
      await handleSubmit();
    } else {
      // Si no hay respuestas, enviar vacío
      await handleSubmit();
    }
  };

  const handleAnswerChange = (questionId: number, value: any, questionType: string) => {
    if (questionType === 'true_false') {
      setAnswers((prev) => {
        const newAnswers = {
          ...prev,
          [questionId]: {
            answer: value,
            justification: prev[questionId]?.justification || ''
          }
        };
        // Guardar en localStorage
        localStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(newAnswers));
        return newAnswers;
      });
    } else {
      setAnswers((prev) => {
        const newAnswers = {
          ...prev,
          [questionId]: value
        };
        // Guardar en localStorage
        localStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(newAnswers));
        return newAnswers;
      });
    }
  };

  const handleJustificationChange = (questionId: number, justification: string) => {
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [questionId]: {
          answer: prev[questionId]?.answer || '',
          justification
        }
      };
      // Guardar en localStorage
      localStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(newAnswers));
      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      // Calcular tiempo transcurrido
      const timeTaken = startTime ? Date.now() - startTime : 0;

      // Limpiar localStorage
      localStorage.removeItem(`quiz_${quizId}_start_time`);
      localStorage.removeItem(`quiz_${quizId}_answers`);

      const response = await fetch(`/api/student/courses/${courseId}/quizzes/${quizId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          time_taken: timeTaken
        })
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.data.results_published) {
          router.push(`/dashboard_estudiante/courses/${courseId}/quizzes/${quizId}/result`);
        } else {
          router.push(`/dashboard_estudiante/courses/${courseId}?message=${encodeURIComponent(result.message)}`);
        }
      } else {
        setError(result.error || 'Error al enviar el quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError('Error al enviar el quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  const { quiz, questions } = data;
  const allAnswered = questions.every((q) => {
    if (q.question_type === 'true_false' && q.require_justification) {
      // Solo requiere justificación si la respuesta es "Falso"
      if (answers[q.id]?.answer === 'Falso') {
        return answers[q.id]?.answer && answers[q.id]?.justification;
      }
      // Si es "Verdadero", solo necesita la respuesta
      return answers[q.id]?.answer;
    }
    if (q.question_type === 'multiple_choice') {
      return Array.isArray(answers[q.id]) && answers[q.id].length > 0;
    }
    return answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '';
  });

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
            <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
            <p className="text-gray-600 mt-1">Curso: {quiz.course_title}</p>
          </div>
          {timeRemaining !== null && (
            <div className={`px-4 py-2 rounded-lg font-mono text-lg font-bold ${
              timeRemaining < 300 
                ? 'bg-red-100 text-red-800' 
                : timeRemaining < 600 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              <Clock className="w-5 h-5 inline mr-2" />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        {/* Información del Quiz */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Puntaje Mínimo</div>
              <div className="font-semibold text-gray-900">{quiz.passing_score}%</div>
            </div>
            {quiz.time_limit_minutes && (
              <div>
                <div className="text-sm text-gray-500">Tiempo Límite</div>
                <div className="font-semibold text-gray-900">{quiz.time_limit_minutes} minutos</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-500">Preguntas</div>
              <div className="font-semibold text-gray-900">{questions.length}</div>
            </div>
          </div>
          {quiz.description && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-700">{quiz.description}</p>
            </div>
          )}
        </div>

        {/* Preguntas */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{question.question}</h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {question.points} pts
                      </span>
                    </div>

                    {/* Opciones según tipo de pregunta */}
                    {(question.question_type === 'single_choice' || question.question_type === 'multiple_choice') && (
                      <div className="space-y-2 mt-4">
                        {question.options && question.options.length > 0 ? (
                          question.options.map((option) => {
                            const isSelected = question.question_type === 'multiple_choice'
                              ? Array.isArray(answers[question.id]) && answers[question.id].includes(option.id.toString())
                              : answers[question.id] === option.id.toString();
                            
                            return (
                              <label
                                key={option.id}
                                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type={question.question_type === 'multiple_choice' ? 'checkbox' : 'radio'}
                                  name={`question_${question.id}`}
                                  value={option.id}
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (question.question_type === 'multiple_choice') {
                                      const currentAnswers = Array.isArray(answers[question.id]) 
                                        ? answers[question.id] 
                                        : [];
                                      const newAnswers = e.target.checked
                                        ? [...currentAnswers, option.id.toString()]
                                        : currentAnswers.filter((id: string) => id !== option.id.toString());
                                      handleAnswerChange(question.id, newAnswers, question.question_type);
                                    } else {
                                      handleAnswerChange(question.id, e.target.value, question.question_type);
                                    }
                                  }}
                                  className="mt-1"
                                />
                                <span className="flex-1 text-gray-700">{option.option_text}</span>
                              </label>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500">No hay opciones disponibles para esta pregunta.</p>
                        )}
                      </div>
                    )}

                    {question.question_type === 'true_false' && (
                      <div className="space-y-4 mt-4">
                        <div className="flex gap-4">
                          {question.options.map((option) => (
                            <label
                              key={option.id}
                              className={`flex items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all flex-1 ${
                                answers[question.id]?.answer === option.option_text
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question_${question.id}`}
                                value={option.option_text}
                                checked={answers[question.id]?.answer === option.option_text}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value, question.question_type)}
                              />
                              <span className="font-medium text-gray-700">{option.option_text}</span>
                            </label>
                          ))}
                        </div>
                        {question.require_justification && answers[question.id]?.answer === 'Falso' ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Justificación (requerida)
                            </label>
                            <textarea
                              value={answers[question.id]?.justification || ''}
                              onChange={(e) => handleJustificationChange(question.id, e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={3}
                              placeholder="Explica por qué es falso..."
                              required
                            />
                          </div>
                        ) : null}
                      </div>
                    )}

                    {question.question_type === 'text' && (
                      <div className="mt-4">
                        <textarea
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value, question.question_type)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={5}
                          placeholder="Escribe tu respuesta..."
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botón de envío */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {Object.keys(answers).length} de {questions.length} preguntas respondidas
                </p>
                {!allAnswered && (
                  <p className="text-sm text-yellow-600 mt-1">
                    Por favor responde todas las preguntas antes de enviar
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting || !allAnswered || (timeRemaining !== null && timeRemaining <= 0)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

