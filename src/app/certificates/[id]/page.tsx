import { queryOne } from '@/lib/db';
import { safeParseJSON } from '@/lib/certificates/certificate-service';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function CertificatePage({ params }: PageProps) {
  try {
    const certificateId = params.id;

    // Obtener certificado de la base de datos
    const certificate = await queryOne(`
      SELECT 
        c.*,
        u.name as student_name,
        u.email as student_email,
        co.title as course_title
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      JOIN courses co ON c.course_id = co.id
      WHERE c.id = ?
    `, [certificateId]);

    if (!certificate) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Certificado no encontrado</h1>
            <p className="text-gray-600">El certificado solicitado no existe o ha sido eliminado.</p>
          </div>
        </div>
      );
    }

    const certificateData = safeParseJSON(certificate.certificate_data);
    
    // Renderizar el HTML del certificado
    return (
      <div dangerouslySetInnerHTML={{ __html: certificateData.html }} />
    );

  } catch (error) {
    console.error('Error loading certificate:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error al cargar certificado</h1>
          <p className="text-gray-600">Ha ocurrido un error al cargar el certificado solicitado.</p>
        </div>
      </div>
    );
  }
}
