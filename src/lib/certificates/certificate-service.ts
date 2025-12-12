/**
 * Servicio principal de certificados
 * Lógica de negocio y coordinación
 */

import { query, queryOne } from '@/lib/db';
import {
  Certificate,
  CertificateMetadata,
  GenerateCertificateConfig,
  CertificateVerification,
  CertificateFilters,
  CertificateStats,
} from '@/types/certificates';
import { getTemplateEngine } from './template-engine';
import { getPDFGenerator } from './pdf-generator';
import type { ResultSetHeader } from 'mysql2';

/**
 * Función helper para parsear JSON de forma segura
 * Maneja casos donde el valor ya es un objeto o es una cadena JSON
 */
export function safeParseJSON(value: any): any {
  if (!value) return {};
  if (typeof value === 'object') return value; // Ya es un objeto
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      console.warn('Error parsing JSON:', value, e);
      return {};
    }
  }
  return {};
}

export class CertificateService {
  /**
   * Generar número de certificado único
   */
  generateCertificateNumber(): string {
    const prefix = 'BIT';
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${prefix}${year}${random}`;
  }

  /**
   * Generar certificados para estudiantes
   */
  async generateCertificates(
    config: GenerateCertificateConfig,
    issued_by: number
  ): Promise<{
    success: boolean;
    generated_count: number;
    certificates: Certificate[];
    errors: Array<{ student_id: number; error: string }>;
  }> {
    const certificates: Certificate[] = [];
    const errors: Array<{ student_id: number; error: string }> = [];

    // Obtener información del curso
    const course = await this.getCourseInfo(config.course_id);
    if (!course) {
      throw new Error('Curso no encontrado');
    }

    // Obtener plantilla
    const template = await this.getTemplate(config.template_id);
    if (!template) {
      throw new Error('Plantilla no encontrada');
    }

    // Generar certificado para cada estudiante
    for (const student_id of config.student_ids) {
      try {
        // Verificar si ya existe
        const existing = await this.checkExistingCertificate(
          student_id,
          config.course_id,
          config.certificate_type
        );

        if (existing) {
          errors.push({
            student_id,
            error: 'Ya existe un certificado para este estudiante',
          });
          continue;
        }

        // Obtener información del estudiante
        const student = await this.getStudentInfo(student_id);
        if (!student) {
          errors.push({
            student_id,
            error: 'Estudiante no encontrado',
          });
          continue;
        }

        // Obtener progreso del estudiante
        const progress = await this.getStudentProgress(student_id, config.course_id);

        // Generar número único
        const certificate_number = this.generateCertificateNumber();

        // Preparar metadata
        const metadata: CertificateMetadata = {
          generation_method: 'manual',
          generated_by: 1, // TODO: Obtener ID del admin desde el contexto
          custom_fields: config.custom_fields || {},
        };

        // Renderizar certificado
        const renderData = this.prepareRenderData(
          certificate_number,
          metadata,
          course
        );

        const templateEngine = getTemplateEngine();
        const html = templateEngine.render(template.html_content, renderData);

        // Crear certificado en BD
        const result = await query<ResultSetHeader>(
          `INSERT INTO certificates (
            user_id, course_id, certificate_type, certificate_number,
            issue_date, completion_date, status, issued_by,
            metadata, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            student_id,
            config.course_id,
            config.certificate_type,
            certificate_number,
            new Date().toISOString().split('T')[0],
            new Date().toISOString().split('T')[0],
            'issued',
            issued_by,
            JSON.stringify({ ...metadata, html }),
          ]
        );

        const certificate: Certificate = {
          id: (result as any as ResultSetHeader).insertId,
          certificate_number,
          user_id: student_id,
          course_id: config.course_id,
          certificate_type: config.certificate_type,
          status: 'issued',
          issued_at: new Date().toISOString(),
          metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        certificates.push(certificate);
      } catch (error) {
        console.error(`Error generando certificado para estudiante ${student_id}:`, error);
        errors.push({
          student_id,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return {
      success: true,
      generated_count: certificates.length,
      certificates,
      errors,
    };
  }

  /**
   * Generar PDF de un certificado
   */
  async generatePDF(certificateId: number): Promise<Buffer> {
    const certificate = await this.getCertificate(certificateId);
    if (!certificate) {
      throw new Error('Certificado no encontrado');
    }

    // Buscar HTML en certificate_data (nuevo formato) o metadata (formato anterior)
    const certificateData = certificate.certificate_data || certificate.metadata;
    const html = (certificateData as any)?.html_content || (certificateData as any)?.html;

    if (!html) {
      throw new Error('HTML del certificado no encontrado');
    }

    const pdfGenerator = getPDFGenerator();
    
    // Verificar si el HTML ya es completo (tiene DOCTYPE)
    const isCompleteHTML = html.trim().startsWith('<!DOCTYPE html>');
    const templateEngine = getTemplateEngine();
    const htmlToUse = isCompleteHTML ? html : templateEngine.createCompleteHTML(html);

    // Generar PDF
    const pdf = await pdfGenerator.generatePDF(htmlToUse, {
      format: 'A4',
      orientation: 'landscape',
      printBackground: true,
    });

    return pdf;
  }

  /**
   * Obtener certificado por ID
   */
  async getCertificate(id: number): Promise<Certificate | null> {
    const result = await queryOne(
      `SELECT * FROM certificates WHERE id = ?`,
      [id]
    );

    if (!result) return null;

    return {
      ...result,
      issued_at: result.issue_date ? new Date(result.issue_date).toISOString() : new Date().toISOString(),
      metadata: safeParseJSON(result.metadata),
      certificate_data: safeParseJSON(result.certificate_data),
    };
  }

  /**
   * Listar certificados con filtros
   */
  async listCertificates(filters: CertificateFilters): Promise<Certificate[]> {
    let sql = `
      SELECT 
        c.*,
        co.title as course_title,
        co.description as course_description,
        cr.professor_rating,
        cr.platform_rating,
        cr.course_rating,
        cr.professor_feedback,
        cr.platform_feedback,
        cr.course_feedback
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      LEFT JOIN course_ratings cr ON c.rating_id = cr.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.user_id) {
      sql += ` AND c.user_id = ?`;
      params.push(filters.user_id);
    }

    if (filters.course_id) {
      sql += ` AND c.course_id = ?`;
      params.push(filters.course_id);
    }

    if (filters.certificate_type) {
      sql += ` AND c.certificate_type = ?`;
      params.push(filters.certificate_type);
    }

    if (filters.status) {
      sql += ` AND c.status = ?`;
      params.push(filters.status);
    }

    if (filters.date_from) {
      sql += ` AND c.issue_date >= ?`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      sql += ` AND c.issue_date <= ?`;
      params.push(filters.date_to);
    }

    sql += ` ORDER BY c.certificate_type ASC, c.created_at DESC`;

    const results = await query(sql, params);

    return results.map((r: any) => {
      return {
        ...r,
        issued_at: r.issue_date ? new Date(r.issue_date).toISOString() : new Date().toISOString(),
        metadata: safeParseJSON(r.metadata),
        certificate_data: safeParseJSON(r.certificate_data),
      };
    });
  }

  /**
   * Revocar certificado
   */
  async revokeCertificate(
    certificateId: number,
    revoked_by: number,
    reason: string
  ): Promise<void> {
    await query(
      `UPDATE certificates 
       SET status = 'revoked', revoked_by = ?, revoked_at = NOW(), revoke_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [revoked_by, reason, certificateId]
    );
  }

  /**
   * Verificar certificado por número
   */
  async verifyCertificate(certificate_number: string): Promise<CertificateVerification> {
    const certificate = await queryOne(
      `SELECT c.*, u.name as student_name, co.title as course_title
       FROM certificates c
       JOIN users u ON c.user_id = u.id
       JOIN courses co ON c.course_id = co.id
       WHERE c.certificate_number = ?`,
      [certificate_number]
    );

    if (!certificate) {
      return {
        valid: false,
        message: 'Certificado no encontrado',
      };
    }

    // Parsear metadata de forma segura
    let metadata = {};
    if (certificate.metadata) {
      try {
        metadata = typeof certificate.metadata === 'string' 
          ? JSON.parse(certificate.metadata) 
          : certificate.metadata;
      } catch (e) {
        console.error('Error parsing metadata:', e);
        metadata = {};
      }
    }

    // Parsear certificate_data de forma segura
    let certificateData = {};
    if (certificate.certificate_data) {
      try {
        certificateData = typeof certificate.certificate_data === 'string' 
          ? JSON.parse(certificate.certificate_data) 
          : certificate.certificate_data;
      } catch (e) {
        console.error('Error parsing certificate_data:', e);
        certificateData = {};
      }
    }

    const issueDate = certificate.issue_date ? new Date(certificate.issue_date).toISOString() : new Date().toISOString();

    if (certificate.status === 'revoked') {
      return {
        valid: false,
        certificate: { ...certificate, metadata, certificate_data: certificateData },
        student_name: (certificateData as any)?.student_name || certificate.student_name,
        course_title: (certificateData as any)?.course_title || certificate.course_title,
        issue_date: issueDate,
        message: `Certificado revocado: ${certificate.revoked_reason || 'Sin razón especificada'}`,
      };
    }

    return {
      valid: true,
      certificate: { ...certificate, metadata, certificate_data: certificateData },
      student_name: (certificateData as any)?.student_name || certificate.student_name,
      course_title: (certificateData as any)?.course_title || certificate.course_title,
      issue_date: issueDate,
      message: 'Certificado válido',
    };
  }

  /**
   * Obtener estadísticas
   */
  async getStats(): Promise<CertificateStats> {
    const total_issued = await queryOne(
      `SELECT COUNT(*) as count FROM certificates WHERE status = 'issued'`
    );

    const total_active = await queryOne(
      `SELECT COUNT(*) as count FROM certificates WHERE status = 'issued'`
    );

    const total_revoked = await queryOne(
      `SELECT COUNT(*) as count FROM certificates WHERE status = 'revoked'`
    );

    const by_type = await query(
      `SELECT certificate_type, COUNT(*) as count FROM certificates GROUP BY certificate_type`
    );

    const by_course = await query(
      `SELECT c.course_id, co.title as course_title, COUNT(*) as count
       FROM certificates c
       JOIN courses co ON c.course_id = co.id
       GROUP BY c.course_id, co.title
       ORDER BY count DESC
       LIMIT 10`
    );

    const recent = await query(
      `SELECT * FROM certificates ORDER BY created_at DESC LIMIT 10`
    );

    return {
      total_issued: total_issued.count,
      total_active: total_active.count,
      total_revoked: total_revoked.count,
      by_type: by_type.reduce((acc: any, row: any) => {
        acc[row.certificate_type] = row.count;
        return acc;
      }, {}),
      by_course: by_course,
      by_month: [],
    };
  }

  // Métodos privados auxiliares

  private async getCourseInfo(courseId: number) {
    const course = await queryOne(
      `SELECT c.*, GROUP_CONCAT(u.name SEPARATOR ', ') as instructors
       FROM courses c
       LEFT JOIN course_instructors ci ON c.id = ci.course_id
       LEFT JOIN users u ON ci.instructor_id = u.id
       WHERE c.id = ?
       GROUP BY c.id`,
      [courseId]
    );

    if (course && course.instructors) {
      course.instructors = course.instructors.split(', ');
    }

    return course;
  }

  private async getTemplate(templateId?: number) {
    if (templateId) {
      return await queryOne(
        `SELECT id, name, html_content, css_styles FROM certificate_templates WHERE id = ? AND is_active = 1`,
        [templateId]
      );
    }

    // Template por defecto
    return await queryOne(
      `SELECT id, name, html_content, css_styles FROM certificate_templates WHERE is_default = 1 AND is_active = 1`
    );
  }

  private async checkExistingCertificate(
    userId: number,
    courseId: number,
    type: 'course_completion' | 'module_completion'
  ): Promise<boolean> {
    const result = await queryOne(
      `SELECT COUNT(*) as count FROM certificates 
       WHERE user_id = ? AND course_id = ? AND certificate_type = ? AND status != 'revoked'`,
      [userId, courseId, type]
    );
    return result.count > 0;
  }

  private async getStudentInfo(userId: number) {
    return await queryOne(
      `SELECT id, name, email FROM users WHERE id = ?`,
      [userId]
    );
  }

  private async getStudentProgress(userId: number, courseId: number) {
    return await queryOne(
      `SELECT * FROM user_courses WHERE user_id = ? AND course_id = ?`,
      [userId, courseId]
    );
  }

  private prepareRenderData(
    certificate_number: string,
    metadata: CertificateMetadata,
    course: any
  ): any {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    return {
      certificate_number,
      student_name: 'Estudiante',
      course_title: course.title,
      duration_hours: course.duration || 0,
      completion_date: new Date().toISOString(),
      issue_date: new Date().toISOString(),
      instructor_names: course.instructor || 'BITCAN',
      organization_name: 'BITCAN',
      verification_url: `${baseUrl}/certificates/verify/${certificate_number}`,
      ...metadata.custom_fields,
    };
  }

  private async sendCertificateEmail(certificate: Certificate, email: string) {
    // TODO: Implementar envío de email
    console.log(`Enviar certificado ${certificate.certificate_number} a ${email}`);
  }
}

// Instancia singleton
let certificateServiceInstance: CertificateService | null = null;

export function getCertificateService(): CertificateService {
  if (!certificateServiceInstance) {
    certificateServiceInstance = new CertificateService();
  }
  return certificateServiceInstance;
}

