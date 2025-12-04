/**
 * Tipos para el sistema de certificados V2
 */

export interface Certificate {
  id: number;
  certificate_number: string;
  user_id: number;
  course_id: number;
  certificate_type: 'course_completion' | 'module_completion';
  status: 'issued' | 'revoked' | 'pending';
  issued_at: string;
  revoked_at?: string;
  revoked_by?: number;
  revoked_reason?: string;
  certificate_data?: CertificateData;
  metadata?: CertificateMetadata;
  created_at: string;
  updated_at: string;
}

export interface CertificateData {
  student_name: string;
  student_email: string;
  course_title: string;
  course_description?: string;
  duration_hours: number;
  completion_date: string;
  issue_date: string;
  instructor_names: string;
  organization_name: string;
  verification_url: string;
  certificate_number: string;
  module_name?: string;
  manual_hours?: number;
  manual_completion_date?: string;
}

export interface CertificateMetadata {
  template_id?: number;
  custom_fields?: Record<string, any>;
  generation_method: 'automatic' | 'manual';
  generated_by: number;
  ip_address?: string;
  user_agent?: string;
}

export interface CertificateTemplate {
  id: number;
  name: string;
  description?: string;
  template_type: 'course_completion' | 'module_completion';
  html_content: string;
  css_styles?: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CertificateFilters {
  user_id?: number;
  course_id?: number;
  certificate_type?: 'course_completion' | 'module_completion';
  status?: 'issued' | 'revoked' | 'pending';
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface GenerateCertificateConfig {
  course_id: number;
  student_ids: number[];
  certificate_type: 'course_completion' | 'module_completion';
  module_name?: string;
  manual_hours?: number;
  manual_start_date?: string;
  manual_completion_date?: string;
  custom_signature?: string;
  custom_message?: string;
  requires_rating?: boolean;
  template_id?: number;
  custom_fields?: Record<string, any>;
}

export interface GenerateCertificateResult {
  generated_count: number;
  errors: Array<{
    student_id: number;
    error: string;
  }>;
  certificates: Array<{
    id: number;
    certificate_number: string;
    user_id: number;
  }>;
}

export interface CertificateVerification {
  valid: boolean;
  certificate?: Certificate;
  student_name?: string;
  course_title?: string;
  issue_date?: string;
  message?: string;
}

export interface CertificateStats {
  total_issued: number;
  total_active: number;
  total_revoked: number;
  by_type: Record<string, number>;
  by_course: Array<{
    course_id: number;
    course_title: string;
    count: number;
  }>;
  by_month: Array<{
    month: string;
    count: number;
  }>;
}

export interface CertificateService {
  generateCertificates(config: GenerateCertificateConfig, adminId: number): Promise<GenerateCertificateResult>;
  generatePDF(certificateId: number): Promise<Buffer>;
  listCertificates(filters: CertificateFilters): Promise<Certificate[]>;
  getCertificate(id: number): Promise<Certificate | null>;
  verifyCertificate(certificateNumber: string): Promise<CertificateVerification>;
  revokeCertificate(certificateId: number, adminId: number, reason: string): Promise<void>;
  getStats(): Promise<CertificateStats>;
  updateCertificate(id: number, updates: Partial<Certificate>): Promise<Certificate>;
}

export interface TemplateEngine {
  render(template: string, data: any): string;
  validate(template: string): { valid: boolean; error?: string };
  extractVariables(template: string): string[];
  createCompleteHTML(content: string, styles?: string): string;
}

export interface PDFGenerator {
  generatePDF(html: string, options?: PDFOptions): Promise<Buffer>;
  generateScreenshot(html: string, options?: ScreenshotOptions): Promise<Buffer>;
}

export interface PDFOptions {
  format?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  fullPage?: boolean;
  quality?: number;
}