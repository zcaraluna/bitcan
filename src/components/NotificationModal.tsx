'use client';

import { useState, useEffect } from 'react';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
  is_viewed: boolean;
  is_dismissed: boolean;
}

export default function NotificationModal() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [dontShowThisAgain, setDontShowThisAgain] = useState(false);

  useEffect(() => {
    loadUnviewedNotifications();
  }, []);

  // Reset del checkbox cuando cambia la notificación
  useEffect(() => {
    setDontShowThisAgain(false);
  }, [currentIndex]);

  const loadUnviewedNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        
        // Obtener IDs de notificaciones ocultas del localStorage
        const hiddenIds = JSON.parse(localStorage.getItem('hidden-notifications') || '[]');
        
        // Filtrar solo las no vistas y no ocultas
        const unviewed = (data.notifications || [])
          .filter((n: Notification) => !n.is_viewed && !hiddenIds.includes(n.id));
        
        if (unviewed.length > 0) {
          setNotifications(unviewed);
          setShowModal(true);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleAction = async () => {
    const currentNotification = notifications[currentIndex];
    
    // Si eligió no volver a mostrar esta notificación
    if (dontShowThisAgain) {
      const hiddenIds = JSON.parse(localStorage.getItem('hidden-notifications') || '[]');
      hiddenIds.push(currentNotification.id);
      localStorage.setItem('hidden-notifications', JSON.stringify(hiddenIds));
    }
    
    // Marcar como vista
    try {
      await fetch(`/api/notifications/${currentNotification.id}/view`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error marking as viewed:', error);
    }

    if (currentIndex < notifications.length - 1) {
      // Hay más notificaciones, pasar a la siguiente
      setCurrentIndex(currentIndex + 1);
    } else {
      // No hay más notificaciones, cerrar
      setShowModal(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  if (!showModal || notifications.length === 0) {
    return null;
  }

  const currentNotification = notifications[currentIndex];

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-12 h-12 text-blue-600" />;
      case 'warning': return <AlertTriangle className="w-12 h-12 text-yellow-600" />;
      case 'success': return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'error': return <AlertCircle className="w-12 h-12 text-red-600" />;
      default: return <Info className="w-12 h-12 text-gray-600" />;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'info': return 'border-blue-500 bg-blue-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'success': return 'border-green-500 bg-green-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
            {notifications.length > 1 && (
              <span className="text-xs text-gray-500">
                {currentIndex + 1} de {notifications.length}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className={`p-6 border-l-4 ${getColorClasses(currentNotification.type)}`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {getIcon(currentNotification.type)}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                {currentNotification.title}
              </h4>
              <p className="text-gray-700 mb-3">
                {currentNotification.message}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(currentNotification.created_at).toLocaleString('es-PY')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dontShowThisAgain"
              checked={dontShowThisAgain}
              onChange={(e) => setDontShowThisAgain(e.target.checked)}
              className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
            />
            <label htmlFor="dontShowThisAgain" className="text-sm text-gray-600 cursor-pointer">
              No volver a mostrar esta notificación
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAction}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
            >
              {currentIndex < notifications.length - 1 ? 'Siguiente' : 'Cerrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
