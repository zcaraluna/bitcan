'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Edit,
  FileText,
  AlertCircle,
  X,
  Check,
  Upload
} from 'lucide-react';

interface Quiz {
  id: number;
  title: string;
  description: string;
  passing_score: number;
  time_limit_minutes?: number;
  is_required: number;
  start_datetime?: string;
  end_datetime?: string;
  results_publish_datetime?: string;
  course_title: string;
  course_id: number;
}

interface Question {
  id: number;
  question: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'text';
  points: number;
  sort_order: number;
  require_justification: number;
  file_path?: string;
  options_count: number;
}

interface Option {
  id: number;
  option_text: string;
  is_correct: number;
  sort_order: number;
}

function EditQuizContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = params.quizId as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [optionsByQuestion, setOptionsByQuestion] = useState<Record<number, Option[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'questions'>('info');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAddOption, setShowAddOption] = useState<number | null>(null);
  
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    passing_score: 70,
    time_limit_minutes: '',
    is_required: false,
    start_datetime: '',
    end_datetime: '',
    results_publish_datetime: '',
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'single_choice' as 'single_choice' | 'multiple_choice' | 'true_false' | 'text',
    points: 1,
    require_justification: false,
    question_file: null as File | null,
  });

  const [optionForm, setOptionForm] = useState({
    option_text: '',
    is_correct: false,
  });

  useEffect(() => {
    if (quizId) {
      fetchQuizData();
    }
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/professor/quizzes/${quizId}/edit`);
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error al cargar el quiz');
        return;
      }

      const result = await response.json();
      if (result.success) {
        setQuiz(result.data.quiz);
        setQuestions(result.data.questions || []);
        // Asegurar que optionsByQuestion sea un objeto con arrays
        const optionsMap: Record<number, Option[]> = {};
        // Primero inicializar todas las preguntas con arrays vacíos
        (result.data.questions || []).forEach((q: Question) => {
          optionsMap[q.id] = [];
        });
        // Luego llenar con las opciones que vienen del servidor
        if (result.data.optionsByQuestion && typeof result.data.optionsByQuestion === 'object') {
          Object.keys(result.data.optionsByQuestion).forEach((key) => {
            const questionId = parseInt(key);
            const options = result.data.optionsByQuestion[questionId];
            if (Array.isArray(options)) {
              optionsMap[questionId] = options;
            }
          });
        }
        setOptionsByQuestion(optionsMap);
        
        // Llenar formulario del quiz
        setQuizForm({
          title: result.data.quiz.title,
          description: result.data.quiz.description,
          passing_score: result.data.quiz.passing_score,
          time_limit_minutes: result.data.quiz.time_limit_minutes || '',
          is_required: result.data.quiz.is_required === 1,
          start_datetime: result.data.quiz.start_datetime ? new Date(result.data.quiz.start_datetime).toISOString().slice(0, 16) : '',
          end_datetime: result.data.quiz.end_datetime ? new Date(result.data.quiz.end_datetime).toISOString().slice(0, 16) : '',
          results_publish_datetime: result.data.quiz.results_publish_datetime ? new Date(result.data.quiz.results_publish_datetime).toISOString().slice(0, 16) : '',
        });
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

  const handleUpdateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const response = await fetch(`/api/professor/quizzes/${quizId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_quiz',
          ...quizForm,
          time_limit_minutes: quizForm.time_limit_minutes || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        showToast({ type: 'success', title: 'Quiz actualizado exitosamente' });
        fetchQuizData();
      } else {
        showToast({ type: 'error', title: result.error || 'Error al actualizar el quiz' });
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      showToast({ type: 'error', title: 'Error al actualizar el quiz' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('action', 'add_question');
      formData.append('question_text', questionForm.question_text);
      formData.append('question_type', questionForm.question_type);
      formData.append('points', questionForm.points.toString());
      formData.append('require_justification', questionForm.require_justification ? '1' : '0');
      if (questionForm.question_file) {
        formData.append('question_file', questionForm.question_file);
      }

      const response = await fetch(`/api/professor/quizzes/${quizId}/edit`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setQuestionForm({
          question_text: '',
          question_type: 'single_choice',
          points: 1,
          require_justification: false,
          question_file: null,
        });
        setShowAddQuestion(false);
        fetchQuizData();
      } else {
        showToast({ type: 'error', title: result.error || 'Error al agregar la pregunta' });
      }
    } catch (error) {
      console.error('Error adding question:', error);
      showToast({ type: 'error', title: 'Error al agregar la pregunta' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddOption = async (questionId: number, e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const response = await fetch(`/api/professor/quizzes/${quizId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_option',
          question_id: questionId,
          option_text: optionForm.option_text,
          is_correct: optionForm.is_correct ? 1 : 0,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setOptionForm({ option_text: '', is_correct: false });
        setShowAddOption(null);
        fetchQuizData();
      } else {
        showToast({ type: 'error', title: result.error || 'Error al agregar la opción' });
      }
    } catch (error) {
      console.error('Error adding option:', error);
      showToast({ type: 'error', title: 'Error al agregar la opción' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta pregunta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/professor/quizzes/${quizId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_question',
          question_id: questionId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchQuizData();
      } else {
        showToast({ type: 'error', title: result.error || 'Error al eliminar la pregunta' });
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      showToast({ type: 'error', title: 'Error al eliminar la pregunta' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOption = async (optionId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta opción?')) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/professor/quizzes/${quizId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_option',
          option_id: optionId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchQuizData();
      } else {
        showToast({ type: 'error', title: result.error || 'Error al eliminar la opción' });
      }
    } catch (error) {
      console.error('Error deleting option:', error);
      showToast({ type: 'error', title: 'Error al eliminar la opción' });
    } finally {
      setSubmitting(false);
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
            <h1 className="text-3xl font-bold text-gray-900">Editar Quiz</h1>
            <p className="text-gray-600 mt-1">Curso: <strong>{quiz.course_title}</strong></p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Información del Quiz
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'questions'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Preguntas ({questions.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <form onSubmit={handleUpdateQuiz} className="space-y-6">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Puntaje Mínimo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Puntaje Mínimo (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quizForm.passing_score}
                    onChange={(e) => setQuizForm({ ...quizForm, passing_score: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                {/* Límite de Tiempo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Límite de Tiempo (minutos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quizForm.time_limit_minutes}
                    onChange={(e) => setQuizForm({ ...quizForm, time_limit_minutes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Sin límite"
                  />
                </div>

                {/* Fecha de Inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={quizForm.start_datetime}
                    onChange={(e) => setQuizForm({ ...quizForm, start_datetime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Fecha de Fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={quizForm.end_datetime}
                    onChange={(e) => setQuizForm({ ...quizForm, end_datetime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Fecha de Publicación de Resultados */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Publicación de Resultados
                  </label>
                  <input
                    type="datetime-local"
                    value={quizForm.results_publish_datetime}
                    onChange={(e) => setQuizForm({ ...quizForm, results_publish_datetime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Obligatorio */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={quizForm.is_required}
                  onChange={(e) => setQuizForm({ ...quizForm, is_required: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="is_required" className="ml-2 text-sm font-medium text-gray-700">
                  Quiz Obligatorio
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard_profesor/courses/${quiz.course_id}?tab=quizzes`)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-6">
            {/* Botón Agregar Pregunta */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Preguntas del Quiz</h2>
              <button
                onClick={() => setShowAddQuestion(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar Pregunta
              </button>
            </div>

            {/* Formulario Agregar Pregunta */}
            {showAddQuestion && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Nueva Pregunta</h3>
                  <button
                    onClick={() => {
                      setShowAddQuestion(false);
                      setQuestionForm({
                        question_text: '',
                        question_type: 'single_choice',
                        points: 1,
                        require_justification: false,
                        question_file: null,
                      });
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texto de la Pregunta <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={questionForm.question_text}
                      onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Pregunta <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={questionForm.question_type}
                        onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="single_choice">Selección Única</option>
                        <option value="multiple_choice">Selección Múltiple</option>
                        <option value="true_false">Verdadero/Falso</option>
                        <option value="text">Texto Libre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Puntos <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={questionForm.points}
                        onChange={(e) => setQuestionForm({ ...questionForm, points: parseFloat(e.target.value) || 1 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Archivo Adjunto
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setQuestionForm({ ...questionForm, question_file: e.target.files?.[0] || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      />
                    </div>
                  </div>
                  {questionForm.question_type === 'true_false' && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="require_justification"
                        checked={questionForm.require_justification}
                        onChange={(e) => setQuestionForm({ ...questionForm, require_justification: e.target.checked })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="require_justification" className="ml-2 text-sm font-medium text-gray-700">
                        Requiere Justificación
                      </label>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Pregunta
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddQuestion(false)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de Preguntas */}
            {questions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay preguntas</h3>
                <p className="text-gray-600 mb-4">Agrega preguntas para completar el quiz.</p>
                <button
                  onClick={() => setShowAddQuestion(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Agregar Primera Pregunta
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {question.question_type === 'single_choice' ? 'Selección Única' :
                             question.question_type === 'multiple_choice' ? 'Selección Múltiple' :
                             question.question_type === 'true_false' ? 'Verdadero/Falso' : 'Texto Libre'}
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            {question.points} puntos
                          </span>
                          {Boolean(question.require_justification) && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                              Requiere Justificación
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 font-medium">{question.question}</p>
                        {question.file_path && (
                          <div className="mt-2">
                            <a
                              href={question.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                            >
                              <Upload className="w-4 h-4" />
                              Ver archivo adjunto
                            </a>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar Pregunta"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Opciones */}
                    {(question.question_type === 'single_choice' || question.question_type === 'multiple_choice' || question.question_type === 'true_false') && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700">Opciones de Respuesta</h4>
                            {question.question_type === 'single_choice' && (
                              <p className="text-xs text-gray-500 mt-1">Solo puede haber una opción correcta</p>
                            )}
                          </div>
                          {showAddOption !== question.id && (
                            <button
                              onClick={() => setShowAddOption(question.id)}
                              className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              Agregar Opción
                            </button>
                          )}
                        </div>

                        {showAddOption === question.id && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <form onSubmit={(e) => handleAddOption(question.id, e)} className="space-y-3">
                              <div>
                                <input
                                  type="text"
                                  value={optionForm.option_text}
                                  onChange={(e) => setOptionForm({ ...optionForm, option_text: e.target.value })}
                                  placeholder="Texto de la opción"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  required
                                />
                              </div>
                              <div className="flex items-center gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={optionForm.is_correct}
                                    onChange={(e) => setOptionForm({ ...optionForm, is_correct: e.target.checked })}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Es correcta</span>
                                </label>
                                <div className="flex gap-2">
                                  <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
                                  >
                                    Agregar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowAddOption(null);
                                      setOptionForm({ option_text: '', is_correct: false });
                                    }}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm font-medium"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        )}

                        {(() => {
                          const questionOptions = optionsByQuestion[question.id];
                          const hasOptions = questionOptions && Array.isArray(questionOptions) && questionOptions.length > 0;
                          
                          return hasOptions ? (
                            <div className="space-y-2 mt-2">
                              {questionOptions.map((option) => (
                                <div
                                  key={option.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                  <div className="flex items-center gap-3">
                                    {Boolean(option.is_correct) ? (
                                      <Check className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <X className="w-5 h-5 text-gray-400" />
                                    )}
                                    <span className={Boolean(option.is_correct) ? 'text-green-700 font-medium' : 'text-gray-700'}>
                                      {option.option_text || 'Sin texto'}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteOption(option.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Eliminar Opción"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-2">
                              No hay opciones agregadas aún.
                            </p>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function EditQuizPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    }>
      <EditQuizContent />
    </Suspense>
  );
}

