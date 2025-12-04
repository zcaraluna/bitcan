'use client';

import { 
  Home, 
  BookOpen, 
  GraduationCap, 
  Award, 
  MessageSquare, 
  Settings, 
  Users,
  BarChart,
  FileText,
  Shield,
  Bell,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  role?: 'estudiante' | 'profesor' | 'superadmin';
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = {
  estudiante: [
    { icon: Home, label: 'Dashboard', href: '/dashboard_estudiante' },
    { icon: GraduationCap, label: 'Explorar Cursos', href: '/dashboard_estudiante/explore' },
    { icon: BookOpen, label: 'Mis Cursos', href: '/dashboard_estudiante/courses' },
    { icon: Award, label: 'Certificados', href: '/dashboard_estudiante/certificates' },
    { icon: MessageSquare, label: 'Mensajes', href: '/dashboard_estudiante/messages' },
  ],
  profesor: [
    { icon: Home, label: 'Dashboard', href: '/dashboard_profesor' },
    { icon: BookOpen, label: 'Mis Cursos', href: '/dashboard_profesor/courses' },
    { icon: FileText, label: 'Evaluaciones', href: '/dashboard_profesor/quizzes/pending' },
    { icon: MessageSquare, label: 'Mensajes', href: '/dashboard_profesor/messages' },
  ],
          superadmin: [
            { icon: Home, label: 'Dashboard', href: '/dashboard_superadmin' },
            { icon: Users, label: 'Usuarios', href: '/dashboard_superadmin/users' },
            { icon: BookOpen, label: 'Cursos', href: '/dashboard_superadmin/courses' },
            { icon: Shield, label: 'Roles', href: '/dashboard_superadmin/roles' },
            { icon: Settings, label: 'Configuración', href: '/dashboard_superadmin/settings' },
            { icon: BarChart, label: 'Reportes', href: '/dashboard_superadmin/reports' },
            { icon: Bell, label: 'Notificaciones', href: '/dashboard_superadmin/notifications' },
            { icon: MessageSquare, label: 'Mensajes', href: '/dashboard_superadmin/messages' },
            { icon: GraduationCap, label: 'Cupones', href: '/dashboard_superadmin/coupons' },
            { icon: Award, label: 'Certificados', href: '/dashboard_superadmin/v2/certificates' },
          ],
};

export default function Sidebar({ role = 'estudiante', isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const items = menuItems[role];

  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static top-0 left-0 h-screen w-64 bg-white shadow-lg z-40 border-r-2 border-gray-300
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header del sidebar en móvil */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-primary">Menú</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="p-4 pt-16">
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={isActive ? 'sidebar-item-active' : 'sidebar-item'}
                    onClick={onClose}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}


