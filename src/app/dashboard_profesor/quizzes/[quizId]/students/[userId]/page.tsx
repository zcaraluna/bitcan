'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { 
  ArrowLeft,
  User,
  Mail,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  AlertCircle
} from 'lucide-react';

interface Quiz {
  id: number;
  title: string;
  description?: string;
  course_title: string;
  course_id: number;
  passing_score: number;
}

interface Student {
  id: number;
  name: string;
  email: string;
}

interface Result {
  id: number;
  score: number;
  max_score: number;
  percentage: number;
  time_taken_minutes?: number;
  completed_at: string;
  needs_manual_grading: number;
}

interface Question {
  id: number;
  question: string;
  question_type: string;
  points: number;
  sort_order: number;
  require_justification: number;
  options: Array<{
    id: number;
    text: string;
    is_correct: number;
  }>;
}

interface ManualGrade {
  awarded_points: number;
  feedback?: string;
}

function StudentQuizAnswersContent() {
  const params = useParams();
  const router = useRouter();
  const quizId = Array.isArray(params.quizId) ? params.quizId[0] : (params.quizId as string);
  const userId = Array.isArray(params.userId) ? params.userId[0] : (params.userId as string);

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, any>>({});
  const [manualGrades, setManualGrades] = useState<Record<number, ManualGrade>>({});
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [editPoints, setEditPoints] = useState<number>(0);
  const [editFeedback, setEditFeedback] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (quizId && userId) {
      fetchData();
    } else {
      setError('ID de quiz o estudiante no válido');
      setLoading(false);
    }
  }, [quizId, userId]);

  const fetchData = async () => {
    if (!quizId || !userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/professor/quizzes/${quizId}/students/${userId}`);

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error al cargar las respuestas');
        return;
      }

      const result = await response.json();
      if (result.success && result.data) {
        setQuiz(result.data.quiz || null);
        setStudent(result.data.student || null);
        setResult(result.data.result || null);
        setQuestions(Array.isArray(result.data.questions) ? result.data.questions : []);
        setStudentAnswers(result.data.student_answers && typeof result.data.student_answers === 'object' ? result.data.student_answers : {});

        // Cargar calificaciones manuales existentes desde la API
        const grades: Record<number, ManualGrade> = {};
        if (result.data.manual_grades && typeof result.data.manual_grades === 'object') {
          for (const [questionId, grade] of Object.entries(result.data.manual_grades)) {
            const qId = parseInt(questionId);
            if (!isNaN(qId) && grade && typeof grade === 'object') {
              grades[qId] = grade as ManualGrade;
            }
          }
        }
        setManualGrades(grades);
      } else {
        setError('Error al cargar las respuestas');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar las respuestas');
    } finally {
      setLoading(false);
    }
  };

  const calculatePoints = (question: Question, answer: any): number => {
    if (question.question_type === 'text') {
      return 0; // Requiere calificación manual
    }

    if (question.question_type === 'true_false' && question.require_justification) {
      if (typeof answer === 'object' && answer.justification) {
        return 0; // Requiere calificación manual
      }
    }

    if (question.question_type === 'multiple_choice' || question.question_type === 'single_choice') {
      const selectedAnswer = Array.isArray(answer) ? answer : [answer];
      let correctAnswers = 0;
      let totalCorrect = 0;
      const questionPoints = typeof question.points === 'number' ? question.points : parseFloat(String(question.points || 0)) || 0;

      for (const option of question.options) {
        if (option.is_correct) {
          totalCorrect++;
          if (selectedAnswer.includes(option.id.toString())) {
            correctAnswers++;
          }
        }
      }

      if (totalCorrect > 0) {
        return parseFloat(((correctAnswers / totalCorrect) * questionPoints).toFixed(2)) || 0;
      }
      return 0;
    }

    if (question.question_type === 'true_false') {
      // Extraer el texto de la respuesta (puede ser objeto con answer y justification, o string directo)
      let answerText: string;
      if (typeof answer === 'object' && answer !== null) {
        answerText = answer.answer || answer;
      } else {
        answerText = answer;
      }
      
      // Convertir a string y limpiar
      answerText = String(answerText || '').trim();
      
      // Buscar la opción correcta (is_correct puede ser 1 o cualquier valor truthy)
      const correctOption = question.options.find(opt => {
        const isCorrect = opt.is_correct === 1 || Boolean(opt.is_correct);
        return isCorrect;
      });
      
      if (!correctOption || !correctOption.text) {
        return 0;
      }
      
      // Obtener el texto de la opción correcta
      const correctText = String(correctOption.text || '').trim();
      
      // Obtener puntos de la pregunta como número
      const questionPoints = typeof question.points === 'number' ? question.points : parseFloat(String(question.points || 0)) || 0;
      
      // Comparación directa primero (como en la API)
      if (answerText === correctText) {
        return questionPoints;
      }
      
      // Si no coincide directamente, normalizar ambos valores para comparación flexible
      const studentAnswerNormalized = answerText.toLowerCase().trim();
      const correctTextNormalized = correctText.toLowerCase().trim();
      
      // Comparación normalizada
      if (studentAnswerNormalized === correctTextNormalized) {
        return questionPoints;
      }
      
      // Mapeo de valores equivalentes para casos especiales
      const normalizeAnswer = (text: string): string[] => {
        const normalized = text.toLowerCase().trim();
        if (normalized === 'verdadero' || normalized === 'true' || normalized === '1') {
          return ['verdadero', 'true', '1'];
        }
        if (normalized === 'falso' || normalized === 'false' || normalized === '0') {
          return ['falso', 'false', '0'];
        }
        return [normalized];
      };
      
      // Obtener valores equivalentes para ambos
      const correctValues = normalizeAnswer(correctText);
      const studentValues = normalizeAnswer(answerText);
      
      // Verificar si hay coincidencia en los valores equivalentes
      const matches = correctValues.some(cv => studentValues.includes(cv)) || 
                     studentValues.some(sv => correctValues.includes(sv));
      
      if (matches) {
        return questionPoints;
      }
      
      return 0;
    }

    return 0;
  };

  const isCorrect = (question: Question, answer: any): boolean => {
    const points = calculatePoints(question, answer);
    return points > 0;
  };

  const needsManualGrading = (question: Question): boolean => {
    return question.question_type === 'text' ||
      (question.question_type === 'true_false' && Boolean(question.require_justification));
  };

  const handleEditGrade = (questionId: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const currentGrade = manualGrades[questionId];
    const answer = studentAnswers[questionId];
    const autoPoints = calculatePoints(question, answer);

    setEditingQuestion(questionId);
    setEditPoints(currentGrade?.awarded_points ?? autoPoints);
    setEditFeedback(currentGrade?.feedback ?? '');
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditPoints(0);
    setEditFeedback('');
  };

  const handleSaveGrade = async (questionId: number) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/professor/quizzes/${quizId}/students/${userId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: questionId,
          awarded_points: editPoints,
          feedback: editFeedback,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error al guardar la calificación');
        return;
      }

      const result = await response.json();
      if (result.success) {
        setSuccess('Calificación actualizada correctamente');
        setManualGrades({
          ...manualGrades,
          [questionId]: {
            awarded_points: editPoints,
            feedback: editFeedback,
          },
        });
        setEditingQuestion(null);
        // Recargar datos para actualizar el resultado total
        await fetchData();
      } else {
        setError('Error al guardar la calificación');
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      setError('Error al guardar la calificación');
    } finally {
      setSaving(false);
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

  if (!quiz || !student || !result) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Toast Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">×</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">×</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Respuestas del Estudiante</h1>
            <h2 className="text-xl text-gray-700 mt-1">{quiz.title}</h2>
            <p className="text-gray-600 mt-1">Curso: <strong>{quiz.course_title}</strong></p>
          </div>
        </div>

        {/* Student Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{student.email}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {typeof result.score === 'number' ? result.score.toFixed(1) : result.score || 0}/{typeof result.max_score === 'number' ? result.max_score : result.max_score || 0}
                </div>
                <div className="text-sm text-gray-600">Puntaje</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {typeof result.percentage === 'number' ? result.percentage.toFixed(1) : result.percentage || 0}%
                </div>
                <div className="text-sm text-gray-600">Porcentaje</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {typeof result.time_taken_minutes === 'number' ? result.time_taken_minutes : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Minutos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Respuestas Detalladas</h3>
          
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg text-gray-600 mb-2">No hay preguntas</h4>
              <p className="text-gray-500">Este quiz no tiene preguntas.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question) => {
                if (!question || !question.id) return null;
                
                const answer = studentAnswers[question.id];
                const needsManual = needsManualGrading(question);
                const hasManualGrade = manualGrades[question.id] !== undefined;
                
                // Calcular puntos obtenidos - asegurar que siempre sea un número
                let pointsEarned = 0;
                if (hasManualGrade) {
                  // Si hay calificación manual, usar esos puntos
                  const manualPoints = manualGrades[question.id]?.awarded_points;
                  pointsEarned = typeof manualPoints === 'number' 
                    ? manualPoints 
                    : parseFloat(String(manualPoints || 0)) || 0;
                } else {
                  // Si no hay calificación manual, calcular automáticamente
                  const calculated = calculatePoints(question, answer);
                  pointsEarned = typeof calculated === 'number' 
                    ? calculated 
                    : parseFloat(String(calculated || 0)) || 0;
                }
                
                // Asegurar que question.points también sea un número
                const questionPoints = typeof question.points === 'number' 
                  ? question.points 
                  : parseFloat(String(question.points || 0)) || 0;
                
                // Determinar si la respuesta es correcta
                // Para preguntas de texto libre, no se determina correcta/incorrecta automáticamente
                // Para otras preguntas, es correcta si obtuvo más del 50% de los puntos
                // (esto permite calificaciones parciales en selección múltiple)
                const isCorrectAnswer = question.question_type !== 'text' 
                  && typeof pointsEarned === 'number' 
                  && !isNaN(pointsEarned)
                  && typeof questionPoints === 'number'
                  && !isNaN(questionPoints)
                  && pointsEarned > 0 
                  && pointsEarned >= (questionPoints * 0.5);
                const isEditing = editingQuestion === question.id;
                const isPending = needsManual && !hasManualGrade;

                return (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Pregunta {typeof question.sort_order === 'number' ? question.sort_order : question.id || 'N/A'}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          {question.question_type ? question.question_type.replace('_', ' ') : 'N/A'}
                        </span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          {typeof question.points === 'number' ? question.points.toFixed(1) : question.points || 0} pts
                        </span>
                        {question.question_type === 'text' ? (
                          // Las preguntas de texto libre no muestran etiquetas de correcta/incorrecta
                          isPending ? (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Pendiente
                            </span>
                          ) : null
                        ) : isPending ? (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Pendiente
                          </span>
                        ) : needsManual ? (
                          // Para preguntas que requieren calificación manual, solo mostrar estado después de calificar
                          hasManualGrade ? (
                            isCorrectAnswer ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Correcta
                              </span>
                            ) : (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Incorrecta
                              </span>
                            )
                          ) : (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Pendiente
                            </span>
                          )
                        ) : isCorrectAnswer ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Correcta
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Incorrecta
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{question.question || 'Sin texto'}</p>

                    {/* Student Answer */}
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Respuesta del Estudiante:
                      </h5>

                      {question.question_type === 'multiple_choice' || question.question_type === 'single_choice' ? (
                        <div className="space-y-2">
                          {Array.isArray(question.options) && question.options.length > 0 ? question.options.map((option) => {
                            if (!option || !option.id) return null;
                            const isSelected = Array.isArray(answer)
                              ? answer.includes(option.id.toString())
                              : answer === option.id.toString();
                            const isCorrect = option.is_correct === 1;

                            return (
                              <div
                                key={option.id}
                                className={`p-3 rounded-lg border-2 ${
                                  isSelected && isCorrect
                                    ? 'bg-green-50 border-green-500'
                                    : isSelected && !isCorrect
                                    ? 'bg-red-50 border-red-500'
                                    : isCorrect
                                    ? 'bg-green-50 border-green-300'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isSelected && (
                                    <CheckCircle className="w-4 h-4 text-blue-600" />
                                  )}
                                  <span>{option.text}</span>
                                  {isCorrect && (
                                    <Award className="w-4 h-4 text-green-600 ml-auto" />
                                  )}
                                </div>
                              </div>
                            );
                          }) : (
                            <p className="text-gray-500 text-sm">No hay opciones disponibles</p>
                          )}
                        </div>
                      ) : question.question_type === 'true_false' ? (
                        <div>
                          {typeof answer === 'object' ? (
                            <>
                              <p className="mb-2">
                                <strong>Respuesta:</strong>{' '}
                                <span className={`px-2 py-1 rounded text-sm ${
                                  answer.answer === 'true' || answer.answer === 'Verdadero'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {answer.answer === 'true' || answer.answer === 'Verdadero' ? 'Verdadero' : 'Falso'}
                                </span>
                              </p>
                              {answer.justification && (
                                <>
                                  <p className="font-semibold text-sm mb-1">Justificación:</p>
                                  <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-gray-700 whitespace-pre-line">{answer.justification}</p>
                                  </div>
                                </>
                              )}
                            </>
                          ) : (
                            <p>
                              <strong>Respuesta:</strong>{' '}
                              <span className={`px-2 py-1 rounded text-sm ${
                                answer === 'true' || answer === 'Verdadero'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {answer === 'true' || answer === 'Verdadero' ? 'Verdadero' : 'Falso'}
                              </span>
                            </p>
                          )}
                        </div>
                      ) : question.question_type === 'text' && answer ? (
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-gray-700 whitespace-pre-line">{answer}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">No respondida</p>
                      )}
                    </div>

                    {/* Points and Edit Form */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="text-sm text-gray-600">
                            <strong>Puntaje obtenido:</strong>{' '}
                            {manualGrades[question.id] ? (
                              <span className="text-green-600 font-semibold">
                                {typeof manualGrades[question.id].awarded_points === 'number' 
                                  ? manualGrades[question.id].awarded_points.toFixed(2) 
                                  : manualGrades[question.id].awarded_points} / {typeof question.points === 'number' ? question.points : question.points || 0} pts
                              </span>
                            ) : needsManual ? (
                              <span className="text-yellow-600 font-semibold">Calificación manual requerida</span>
                            ) : (
                              <span className="font-semibold">
                                {typeof pointsEarned === 'number' ? pointsEarned.toFixed(2) : pointsEarned || 0} / {typeof question.points === 'number' ? question.points : question.points || 0} pts
                              </span>
                            )}
                          </span>
                          {manualGrades[question.id]?.feedback && (
                            <p className="text-sm text-blue-600 mt-1">
                              <strong>Feedback:</strong> {manualGrades[question.id].feedback}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleEditGrade(question.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar Calificación"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>

                      {isEditing && (
                        <div className="bg-gray-50 p-4 rounded-lg mt-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Puntos Otorgados
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={question.points}
                                  step="0.1"
                                  value={editPoints}
                                  onChange={(e) => setEditPoints(parseFloat(e.target.value) || 0)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                <span className="text-gray-600">/ {question.points}</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Feedback (opcional)
                              </label>
                              <textarea
                                value={editFeedback}
                                onChange={(e) => setEditFeedback(e.target.value)}
                                rows={2}
                                placeholder="Comentarios sobre la respuesta del estudiante..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                              disabled={saving}
                            >
                              <X className="w-4 h-4" />
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleSaveGrade(question.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                              disabled={saving}
                            >
                              {saving ? (
                                <>
                                  <LoadingSpinner size="sm" />
                                  Guardando...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4" />
                                  Guardar Calificación
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function StudentQuizAnswersPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    }>
      <StudentQuizAnswersContent />
    </Suspense>
  );
}

