'use client';

import { User, Menu, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
  onMenuClick?: () => void;
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      router.push('/login');
    }
  };

  return (
    <header className="bg-gray-800 text-white shadow-lg fixed top-0 left-0 right-0 z-50 border-b-2 border-gray-300 h-20">
      <div className="flex items-center justify-between px-6 py-5 h-full">
        {/* Logo y menú móvil */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/bitcan-logo.png"
              alt="BITCAN"
              width={40}
              height={40}
              className="object-contain"
            />
            <h1 className="text-xl font-bold">BITCAN</h1>
          </Link>
        </div>

        {/* Acciones del usuario */}
        <div className="flex items-center gap-4">
          {/* Notificaciones */}
          <NotificationBell />

          {/* Perfil de usuario */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">{user?.name || 'Usuario'}</div>
                <div className="text-xs text-white/80 capitalize">{user?.role || 'estudiante'}</div>
              </div>
            </button>

            {/* Menú desplegable */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 text-gray-700 animate-fadeIn">
                {user?.role === 'estudiante' && (
                  <Link href="/dashboard_estudiante/profile" className="block px-4 py-2 hover:bg-gray-100">
                    Mi Perfil
                  </Link>
                )}
                {user?.role === 'profesor' && (
                  <Link href="/dashboard_profesor" className="block px-4 py-2 hover:bg-gray-100">
                    Mi Perfil
                  </Link>
                )}
                {user?.role === 'superadmin' && (
                  <Link href="/dashboard_superadmin/settings" className="block px-4 py-2 hover:bg-gray-100">
                    Configuración
                  </Link>
                )}
                <hr className="my-1" />
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


