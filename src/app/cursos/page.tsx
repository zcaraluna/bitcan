import DashboardLayout from '@/components/DashboardLayout';
import CourseCard from '@/components/CourseCard';
import { Search, Filter } from 'lucide-react';

const allCourses = [
  {
    id: 1,
    title: 'Introducción a la Forensia Digital',
    description: 'Aprende los fundamentos del análisis forense digital y las técnicas de investigación',
    duration: 40,
    students: 156,
    rating: 4.8,
    progress: 65,
    instructor: 'Carlos Insfrán',
  },
  {
    id: 2,
    title: 'Ciberseguridad Avanzada',
    description: 'Técnicas avanzadas de seguridad informática y protección de sistemas',
    duration: 60,
    students: 203,
    rating: 4.9,
    progress: 30,
    instructor: 'Miguel Godoy',
  },
  {
    id: 3,
    title: 'Pentesting Profesional',
    description: 'Conviértete en un experto en pentesting y hacking ético',
    duration: 80,
    students: 178,
    rating: 4.7,
    progress: 0,
    instructor: 'Esmilce Vega',
  },
  {
    id: 4,
    title: 'Análisis de Malware',
    description: 'Aprende a identificar, analizar y neutralizar amenazas de malware',
    duration: 45,
    students: 134,
    rating: 4.6,
    instructor: 'Carlos Insfrán',
  },
  {
    id: 5,
    title: 'Seguridad en Redes',
    description: 'Protección de infraestructuras de red y detección de intrusiones',
    duration: 55,
    students: 189,
    rating: 4.8,
    instructor: 'Miguel Godoy',
  },
  {
    id: 6,
    title: 'Criptografía Aplicada',
    description: 'Fundamentos y aplicaciones prácticas de criptografía moderna',
    duration: 50,
    students: 145,
    rating: 4.7,
    instructor: 'Esmilce Vega',
  },
];

export default function CoursesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Cursos</h1>
            <p className="text-gray-600">Explora y aprende con nuestros cursos especializados</p>
          </div>
        </div>

        {/* Búsqueda y filtros */}
        <div className="card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Barra de búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cursos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-card focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
            
            {/* Filtros */}
            <button className="btn-outline flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>

          {/* Tags de filtros rápidos */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            <button className="px-3 py-1 bg-primary text-white rounded-full text-sm whitespace-nowrap">
              Todos
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full text-sm whitespace-nowrap transition-colors">
              En progreso
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full text-sm whitespace-nowrap transition-colors">
              Por comenzar
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full text-sm whitespace-nowrap transition-colors">
              Completados
            </button>
          </div>
        </div>

        {/* Lista de cursos */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {allCourses.length} cursos
            </p>
            <select className="text-sm border border-gray-300 rounded-card px-3 py-1 outline-none focus:ring-2 focus:ring-primary">
              <option>Más recientes</option>
              <option>Más populares</option>
              <option>Mejor calificados</option>
              <option>A-Z</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCourses.map((course) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </div>
        </div>

        {/* Paginación */}
        <div className="flex justify-center gap-2 mt-8">
          <button className="px-3 py-1 border border-gray-300 rounded-card hover:bg-gray-50">
            Anterior
          </button>
          <button className="px-3 py-1 bg-primary text-white rounded-card">1</button>
          <button className="px-3 py-1 border border-gray-300 rounded-card hover:bg-gray-50">2</button>
          <button className="px-3 py-1 border border-gray-300 rounded-card hover:bg-gray-50">3</button>
          <button className="px-3 py-1 border border-gray-300 rounded-card hover:bg-gray-50">
            Siguiente
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}



