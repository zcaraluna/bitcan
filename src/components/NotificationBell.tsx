'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
  is_viewed: boolean;
  is_dismissed: boolean;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Recargar cada 60 segundos
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsViewed = async (notificationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/notifications/${notificationId}/view`, {
        method: 'POST',
      });
      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as viewed:', error);
    }
  };

  const dismissNotification = async (notificationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/notifications/${notificationId}/dismiss`, {
        method: 'POST',
      });
      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const unviewedCount = notifications.filter(n => !n.is_viewed).length;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info': return 'border-l-4 border-blue-500 bg-blue-50';
      case 'warning': return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'success': return 'border-l-4 border-green-500 bg-green-50';
      case 'error': return 'border-l-4 border-red-500 bg-red-50';
      default: return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unviewedCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unviewedCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-[500px] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              {unviewedCount > 0 && (
                <span className="text-xs text-gray-500">{unviewedCount} nueva(s)</span>
              )}
            </div>

            <div className="overflow-y-auto max-h-96">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.is_viewed ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-1 ${getNotificationColor(notification.type)} p-3 rounded`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">{notification.title}</h4>
                              <p className="text-sm text-gray-600">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notification.created_at).toLocaleString('es-PY')}
                              </p>
                            </div>
                            <button
                              onClick={(e) => dismissNotification(notification.id, e)}
                              className="p-1 hover:bg-white rounded transition-colors"
                              title="Descartar"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                        {!notification.is_viewed && (
                          <button
                            onClick={(e) => markAsViewed(notification.id, e)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Marcar como leída"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No tienes notificaciones</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
