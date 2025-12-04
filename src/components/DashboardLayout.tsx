'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import LoadingSpinner from './LoadingSpinner';
import NotificationModal from './NotificationModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Obtener usuario autenticado
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          
          // Verificar si el perfil está completado ANTES de setear el usuario
          if (!data.user.profile_completed && data.user.role !== 'superadmin') {
            // Redirigir a completar perfil SIN cargar el dashboard
            window.location.href = '/completar-perfil';
            return;
          }
          
          setUser(data.user);
        } else {
          // No autenticado, redirigir a login
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex pt-20">
        <Sidebar 
          role={user?.role || 'estudiante'} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 p-6 lg:ml-0 bg-white min-h-[calc(100vh-5rem)] border-l-2 border-gray-300">
          <div className="max-w-none">
            {children}
          </div>
        </main>
      </div>

      {/* Modal de notificaciones automáticas */}
      <NotificationModal />
    </div>
  );
}


