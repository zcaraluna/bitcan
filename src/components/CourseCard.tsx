import { Clock, Users, Star } from 'lucide-react';
import Link from 'next/link';

interface CourseCardProps {
  id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  imageUrl?: string;
  duration?: number;
  students?: number;
  rating?: number;
  progress?: number;
  instructor?: string;
  href?: string;
}

export default function CourseCard({
  id,
  title,
  description,
  thumbnail,
  imageUrl,
  duration,
  students,
  rating,
  progress,
  instructor,
  href,
}: CourseCardProps) {
  return (
    <Link href={href || `/cursos/${id}`} className="block">
      <div className="card hover-lift animate-fadeIn overflow-hidden">
        {/* Imagen del curso */}
        <div className="h-48 bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
          {(thumbnail || imageUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnail || imageUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold">
              {title.charAt(0)}
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2 line-clamp-2">{title}</h3>
          {description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            {duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{duration}h</span>
              </div>
            )}
            {students && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{students.toLocaleString('es-ES')}</span>
              </div>
            )}
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Instructor */}
          {instructor && (
            <p className="text-sm text-gray-600 mb-3">Por {instructor}</p>
          )}

          {/* Barra de progreso */}
          {typeof progress === 'number' && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Progreso</span>
                <span className="font-medium text-primary">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}


