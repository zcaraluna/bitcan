// Tipos de usuario
export type UserRole = 'estudiante' | 'profesor' | 'superadmin';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  organization?: string;
  provider: 'email' | 'google' | 'microsoft' | 'institutional';
  email_verified: boolean;
  profile_completed: boolean;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  bio?: string;
  avatar_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  created_at: string;
  updated_at: string;
}

// Tipos de cursos
export interface Course {
  id: number;
  title: string;
  description: string;
  short_description?: string;
  instructor_id: number;
  category_id?: number;
  thumbnail_url?: string;
  is_published: boolean;
  is_free: boolean;
  price?: number;
  duration_hours?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  certificate_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  content: string;
  lesson_order: number;
  duration_minutes?: number;
  video_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: number;
  lesson_id: number;
  course_id: number;
  title: string;
  description?: string;
  time_limit_minutes?: number;
  passing_score: number;
  max_attempts?: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  points: number;
  question_order: number;
  has_file_upload: boolean;
  correct_answer?: string;
  created_at: string;
  updated_at: string;
}

// Tipos de progreso
export interface UserCourse {
  id: number;
  user_id: number;
  course_id: number;
  enrollment_date: string;
  completion_date?: string;
  progress_percentage: number;
  status: 'active' | 'completed' | 'dropped';
  payment_status?: 'pending' | 'paid' | 'free';
  payment_amount?: number;
}

export interface UserLesson {
  id: number;
  user_id: number;
  lesson_id: number;
  completed: boolean;
  completed_at?: string;
  last_accessed?: string;
}

export interface QuizResult {
  id: number;
  user_id: number;
  quiz_id: number;
  score: number;
  total_points: number;
  passed: boolean;
  attempt_number: number;
  started_at: string;
  submitted_at?: string;
}

// Tipos de notificaciones
export interface Notification {
  id: number;
  user_id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

// Tipos de mensajes
export interface Message {
  id: number;
  sender_id: number;
  recipient_type: 'user' | 'role' | 'course';
  recipient_id: number;
  subject: string;
  body: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

// Estadísticas del dashboard
export interface DashboardStats {
  totalStudents?: number;
  totalCourses?: number;
  totalEnrollments?: number;
  activeStudents?: number;
  completedCourses?: number;
  avgProgress?: number;
  pendingQuizzes?: number;
  unreadMessages?: number;
}


