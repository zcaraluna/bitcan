'use client';

/**
 * Página de generación de certificados para un curso
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import CertificateGeneratorV2 from '@/components/certificates/CertificateGeneratorV2';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function GenerateCertificatesPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.courseId as string);
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/certificates/courses/${courseId}`);
      const data = await response.json();
      
      if (data.success) {
        setCourse(data.data);
      } else {
        alert('Error al cargar curso');
        router.push('/dashboard_superadmin/courses');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      alert('Error al cargar curso');
      router.push('/dashboard_superadmin/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard_superadmin/v2/certificates');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Curso no encontrado</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push('/dashboard_superadmin/v2/certificates')}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-flex items-center gap-2"
          >
            ← Volver
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Generar Certificados
          </h1>
          <p className="text-gray-600">
            Curso: {course.title}
          </p>
        </div>

        {/* Generador */}
        <CertificateGeneratorV2
          courseId={courseId}
          courseTitle={course.title}
          onComplete={handleComplete}
        />
      </div>
    </DashboardLayout>
  );
}

