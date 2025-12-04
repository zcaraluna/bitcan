'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { Search, Filter, BookOpen, Clock, Users, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  short_description?: string;
  description: string;
  duration_hours?: number;
  duration_minutes?: number;
  thumbnail_url?: string;
  level?: string;
  is_free: boolean;
  price?: number;
  price_pyg?: number;
  exchange_rate_usd?: number;
  exchange_rate_ars?: number;
  exchange_rate_brl?: number;
  requires_approval?: boolean;
  payment_bank?: string;
  payment_account?: string;
  payment_holder?: string;
  payment_id?: string;
  payment_ruc?: string;
  payment_alias?: string;
  payment_whatsapp?: string;
  payment_crypto_wallet?: string;
  payment_crypto_network?: string;
  payment_crypto_currency?: string;
  students_count: number;
  instructor?: string;
  category_name?: string;
  is_enrolled?: boolean;
  has_pending_application?: boolean;
  application_rejected?: boolean;
}

interface Category {
  id: number;
  name: string;
}

export default function ExplorarCursos() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bank' | 'crypto'>('bank');
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener cursos disponibles
        const coursesResponse = await fetch('/api/student/available-courses');
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCourses(coursesData.data || []);
        }

        // Obtener categorías
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.data || []);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error al cargar los cursos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar cursos
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.short_description || course.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || course.category_name === categories.find(c => c.id === selectedCategory)?.name;
    const matchesLevel = !selectedLevel || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const handleEnroll = (course: Course) => {
    try {
      // Si el curso es gratuito, inscribir directamente
      if (course.is_free || !course.price || Number(course.price) <= 0) {
        submitEnrollment(course.id);
        return;
      }
      
      // Si es de pago, mostrar modal
      setSelectedCourse(course);
      setShowPaymentModal(true);
      setCouponCode('');
      setAppliedCoupon(null);
      setCouponMessage('');
      setSelectedPaymentMethod('bank');
    } catch (error) {
      console.error('Error en handleEnroll:', error);
      toast.error('Error', 'Ocurrió un error al procesar la solicitud');
    }
  };

  const submitEnrollment = async (courseId: number, couponId?: number, discountPercentage?: number) => {
    try {
      const body: any = { course_id: courseId };
      if (couponId && discountPercentage) {
        body.coupon_id = couponId;
        body.discount_percentage = discountPercentage;
      }

      const response = await fetch('/api/student/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setShowPaymentModal(false);
        if (data.pending) {
          // Actualizar el estado del curso como solicitud pendiente
          setCourses(prev => prev.map(c => 
            c.id === courseId ? { ...c, has_pending_application: true } : c
          ));
          toast.success(
            'Postulación enviada',
            'Tu postulación ha sido enviada. Realiza el pago y espera la confirmación.'
          );
        } else {
          // Actualizar el estado del curso como inscrito
          setCourses(prev => prev.map(c => 
            c.id === courseId ? { ...c, is_enrolled: true } : c
          ));
          toast.success(
            '¡Inscripción exitosa!',
            'Ya puedes acceder al contenido del curso.'
          );
          // Redirigir a mis cursos después de un momento
          setTimeout(() => router.push('/dashboard_estudiante/courses'), 1500);
        }
      } else {
        toast.error('Error', data.error || 'No se pudo completar la inscripción');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error('Error de conexión', 'No se pudo conectar con el servidor');
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !selectedCourse) {
      setCouponMessage('Ingresa un código de cupón');
      return;
    }

    if (!selectedCourse.price || selectedCourse.price <= 0) {
      setCouponMessage('Este curso no tiene precio válido');
      return;
    }

    try {
      const response = await fetch('/api/student/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_code: couponCode,
          course_id: selectedCourse.id,
          course_price: Number(selectedCourse.price)
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAppliedCoupon(data.coupon);
        setCouponMessage(`✓ Cupón aplicado: ${data.coupon.discount_percentage}% de descuento`);
      } else {
        setAppliedCoupon(null);
        setCouponMessage(data.error || 'Cupón inválido');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponMessage('Error al verificar el cupón');
      setAppliedCoupon(null);
    }
  };

  const getLevelLabel = (level?: string) => {
    switch (level) {
      case 'beginner': return 'Principiante';
      case 'intermediate': return 'Intermedio';
      case 'advanced': return 'Avanzado';
      default: return level || 'Todos los niveles';
    }
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              Reintentar
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg p-8">
            <h1 className="text-4xl font-bold mb-2">Explorar Cursos</h1>
            <p className="text-blue-50 text-lg">Descubre nuevos cursos y amplía tus conocimientos</p>
          </div>

          {/* Búsqueda y filtros */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Barra de búsqueda */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              {/* Filtro por categoría */}
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Filtro por nivel */}
              <select
                value={selectedLevel || ''}
                onChange={(e) => setSelectedLevel(e.target.value || null)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Todos los niveles</option>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>

            {/* Resultados */}
            <div className="mt-4 text-sm text-gray-600">
              Mostrando {filteredCourses.length} de {courses.length} cursos
            </div>
          </div>

          {/* Lista de cursos */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow relative">
                  {/* Imagen del curso */}
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 relative overflow-hidden">
                    {course.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold">
                        {course.title.charAt(0)}
                      </div>
                    )}
                    {/* Badge de nivel */}
                    <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                      {getLevelLabel(course.level)}
                    </span>
                    {/* Badge de inscrito */}
                    {course.is_enrolled && (
                      <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                        Inscrito
                      </span>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {course.short_description || course.description}
                    </p>

                    {/* Info del curso */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      {(course.duration_hours || course.duration_minutes) && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {course.duration_hours ? `${course.duration_hours}h` : ''}
                            {course.duration_minutes ? ` ${course.duration_minutes}m` : ''}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.students_count} estudiantes</span>
                      </div>
                    </div>

                    {/* Instructor */}
                    {course.instructor && (
                      <p className="text-sm text-gray-600 mb-4">
                        Por: <span className="font-medium">{course.instructor}</span>
                      </p>
                    )}

                    {/* Precio y botón */}
                    <div className="flex items-center justify-between">
                      <div>
                        {course.is_free ? (
                          <span className="text-green-600 font-bold">Gratis</span>
                        ) : (
                          <PriceDisplay 
                            pricePyg={course.price_pyg || (course.price ? course.price * (course.exchange_rate_usd || 7500) : 0)}
                            exchangeRateUsd={course.exchange_rate_usd}
                            exchangeRateArs={course.exchange_rate_ars}
                            exchangeRateBrl={course.exchange_rate_brl}
                          />
                        )}
                      </div>
                      
                      {course.is_enrolled ? (
                        <button
                          onClick={() => router.push('/dashboard_estudiante/courses')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Continuar
                        </button>
                      ) : course.has_pending_application ? (
                        <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium">
                          Pendiente
                        </span>
                      ) : course.application_rejected ? (
                        <span className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-medium">
                          Rechazado
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          {course.is_free || !course.price || course.price <= 0 
                            ? 'Inscribirse' 
                            : course.requires_approval 
                              ? 'Postular al Curso' 
                              : 'Inscribirse Ahora'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron cursos</h3>
              <p className="text-gray-600">Intenta con otros filtros o términos de búsqueda</p>
            </div>
          )}

          {/* Modal de Pago */}
          {showPaymentModal && selectedCourse && selectedCourse.id && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Información de Pago</h2>
                    <button
                      onClick={() => {
                        setShowPaymentModal(false);
                        setSelectedCourse(null);
                        setCouponCode('');
                        setAppliedCoupon(null);
                        setCouponMessage('');
                        setSelectedPaymentMethod('bank');
                      }}
                      className="text-white hover:text-gray-200 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Información de Pago */}
                    <div className="lg:col-span-2 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Instrucciones de Pago</h3>
                        <p className="text-gray-700 mb-4">
                          Selecciona tu método de pago preferido:
                        </p>
                      </div>

                      {/* Selector de Método de Pago */}
                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={() => setSelectedPaymentMethod('bank')}
                          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                            selectedPaymentMethod === 'bank'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Transferencia Bancaria
                        </button>
                        <button
                          onClick={() => setSelectedPaymentMethod('crypto')}
                          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                            selectedPaymentMethod === 'crypto'
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Billetera Cripto
                        </button>
                      </div>

                      {/* Método: Transferencia Bancaria */}
                      {selectedPaymentMethod === 'bank' && (
                        <div className="space-y-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">Datos Bancarios</h4>
                            <div className="space-y-2 text-sm">
                              {selectedCourse.payment_holder && (
                                <p><strong>Titular:</strong> {selectedCourse.payment_holder}</p>
                              )}
                              {selectedCourse.payment_id && (
                                <p><strong>CI:</strong> {selectedCourse.payment_id}</p>
                              )}
                              {selectedCourse.payment_ruc && (
                                <p><strong>RUC:</strong> {selectedCourse.payment_ruc}</p>
                              )}
                              {selectedCourse.payment_bank && (
                                <p><strong>Entidad:</strong> {selectedCourse.payment_bank}</p>
                              )}
                              {selectedCourse.payment_account && (
                                <p><strong>N° de cuenta:</strong> {selectedCourse.payment_account}</p>
                              )}
                              {selectedCourse.payment_alias && (
                                <>
                                  <hr className="my-2" />
                                  <p className="mb-0"><strong>Alternativa por Alias:</strong></p>
                                  <p className="mb-0"><strong>Alias:</strong> {selectedCourse.payment_alias}</p>
                                  {selectedCourse.payment_holder && (
                                    <p className="mb-0"><strong>Titular:</strong> {selectedCourse.payment_holder}</p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Método: Billetera Cripto */}
                      {selectedPaymentMethod === 'crypto' && (
                        <div className="space-y-4">
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">Datos de Billetera Cripto</h4>
                            <div className="space-y-2 text-sm">
                              {selectedCourse.payment_crypto_currency && (
                                <p><strong>Moneda:</strong> {selectedCourse.payment_crypto_currency}</p>
                              )}
                              {selectedCourse.payment_crypto_network && (
                                <p><strong>Red:</strong> {selectedCourse.payment_crypto_network}</p>
                              )}
                              {selectedCourse.payment_crypto_wallet && (
                                <div className="mt-3">
                                  <p className="mb-1"><strong>Dirección de Billetera:</strong></p>
                                  <div className="bg-white p-3 rounded border border-orange-300 break-all font-mono text-xs">
                                    {selectedCourse.payment_crypto_wallet}
                                  </div>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(selectedCourse.payment_crypto_wallet || '');
                                      toast.success('Copiado', 'Dirección copiada al portapapeles');
                                    }}
                                    className="mt-2 text-xs text-orange-600 hover:text-orange-700 underline"
                                  >
                                    Copiar dirección
                                  </button>
                                </div>
                              )}
                              {!selectedCourse.payment_crypto_wallet && !selectedCourse.payment_crypto_network && !selectedCourse.payment_crypto_currency && (
                                <p className="text-gray-500 italic">No se ha configurado información de pago cripto para este curso.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Importante</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {selectedCourse.payment_whatsapp && (
                            <li>
                              Envía el comprobante de pago al WhatsApp:{' '}
                              <strong>{selectedCourse.payment_whatsapp}</strong>
                            </li>
                          )}
                          <li>
                            Incluye tu nombre completo, número de contacto y el código o nombre del curso en el mensaje
                          </li>
                          {selectedPaymentMethod === 'crypto' && (
                            <li className="text-orange-700 font-medium">
                              Verifica cuidadosamente la dirección de la billetera y la red antes de enviar
                            </li>
                          )}
                          <li>
                            Tu inscripción será confirmada dentro de las próximas 24 horas después de haber enviado el mensaje
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Resumen y Cupón */}
                    <div className="lg:col-span-1">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 sticky top-4">
                        <h4 className="font-semibold mb-4 text-center">Resumen</h4>
                        <div className="space-y-2 mb-4">
                          <p className="text-sm">
                            <strong>Curso:</strong> {selectedCourse.title}
                          </p>
                          <p className="text-sm">
                            <strong>Precio Original:</strong>
                            <br />
                            <span className="text-blue-600 font-bold">
                              USD {selectedCourse.price ? Number(selectedCourse.price).toFixed(2) : '0.00'}
                            </span>
                            <br />
                            <small className="text-gray-500">
                              PYG {((selectedCourse.price ? Number(selectedCourse.price) : 0) * (selectedCourse.exchange_rate_usd ? Number(selectedCourse.exchange_rate_usd) : 7500)).toLocaleString('es-PY')}
                            </small>
                          </p>
                        </div>

                        {/* Sección de Cupón */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="font-semibold mb-2 text-sm">Cupón de Descuento</h5>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              placeholder="Código de cupón"
                              maxLength={20}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            <button
                              onClick={applyCoupon}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                            >
                              Aplicar
                            </button>
                          </div>
                          {couponMessage && (
                            <p className={`text-xs ${appliedCoupon ? 'text-green-600' : 'text-red-600'}`}>
                              {couponMessage}
                            </p>
                          )}

                          {/* Precio con descuento */}
                          {appliedCoupon && selectedCourse.price && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs mb-1">
                                <strong>Descuento:</strong>{' '}
                                <span className="text-green-600">
                                  -USD {((Number(selectedCourse.price) * Number(appliedCoupon.discount_percentage)) / 100).toFixed(2)}
                                </span>
                              </p>
                              <p className="text-sm">
                                <strong>Precio Final:</strong>{' '}
                                <span className="text-blue-600 font-bold">
                                  USD {(Number(selectedCourse.price) - (Number(selectedCourse.price) * Number(appliedCoupon.discount_percentage)) / 100).toFixed(2)}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                          <button
                            onClick={() => submitEnrollment(
                              selectedCourse.id,
                              appliedCoupon?.id,
                              appliedCoupon?.discount_percentage
                            )}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors"
                          >
                            Confirmar Postulación
                          </button>
                          <button
                            onClick={() => {
                              setShowPaymentModal(false);
                              setSelectedCourse(null);
                              setCouponCode('');
                              setAppliedCoupon(null);
                              setCouponMessage('');
                              setSelectedPaymentMethod('bank');
                            }}
                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

// Componente para mostrar el precio con conversiones
interface PriceDisplayProps {
  pricePyg: number;
  exchangeRateUsd?: number;
  exchangeRateArs?: number;
  exchangeRateBrl?: number;
}

function PriceDisplay({ pricePyg, exchangeRateUsd, exchangeRateArs, exchangeRateBrl }: PriceDisplayProps) {
  const [showConversions, setShowConversions] = useState(false);

  const formatPyg = (value: number) => {
    if (!value || isNaN(value)) return '₲ 0';
    return `₲ ${Math.round(value).toLocaleString('es-PY')}`;
  };

  const formatUsd = (value: number) => {
    if (!value || isNaN(value)) return '$ 0.00';
    return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatArs = (value: number) => {
    if (!value || isNaN(value)) return 'ARS 0';
    return `ARS ${Math.round(value).toLocaleString('es-AR')}`;
  };

  const formatBrl = (value: number) => {
    if (!value || isNaN(value)) return 'R$ 0.00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const safePricePyg = Number(pricePyg) || 0;
  const safeUsd = Number(exchangeRateUsd) || 7500;
  const safeArs = Number(exchangeRateArs) || 7.50;
  const safeBrl = Number(exchangeRateBrl) || 1450;

  return (
    <div className="relative">
      <button
        onClick={() => setShowConversions(!showConversions)}
        className="text-gray-900 font-bold hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1"
        title="Click para ver en otras monedas"
      >
        {formatPyg(safePricePyg)}
        <svg className={`w-3 h-3 transition-transform ${showConversions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {showConversions && (
        <div className="absolute left-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-[160px]">
          <div className="text-xs text-gray-500 mb-2">Equivalente a:</div>
          <div className="space-y-1 text-sm">
            {safeUsd > 0 && (
              <div className="text-gray-700">
                {formatUsd(safePricePyg / safeUsd)}
              </div>
            )}
            {safeArs > 0 && (
              <div className="text-gray-700">
                {formatArs(safePricePyg / safeArs)}
              </div>
            )}
            {safeBrl > 0 && (
              <div className="text-gray-700">
                {formatBrl(safePricePyg / safeBrl)}
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
            Tasas al momento de creación
          </div>
        </div>
      )}
    </div>
  );
}

