'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const success = (title: string, message?: string) => {
    showToast({ type: 'success', title, message, duration: 8000 });
  };

  const error = (title: string, message?: string) => {
    showToast({ type: 'error', title, message, duration: 8000 });
  };

  const warning = (title: string, message?: string) => {
    showToast({ type: 'warning', title, message, duration: 8000 });
  };

  const info = (title: string, message?: string) => {
    showToast({ type: 'info', title, message, duration: 8000 });
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;
  
  return (
    <>
      {/* Overlay con blur de fondo */}
      <div className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto" />
      
      {/* Contenedor de toasts */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
        <div className="flex flex-col gap-3">
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
          ))}
        </div>
      </div>
    </>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-remove after duration
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 8000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const styles = {
    success: {
      bg: 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600',
      iconBg: 'bg-white/20',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-gradient-to-br from-red-500 via-rose-500 to-pink-600',
      iconBg: 'bg-white/20',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500',
      iconBg: 'bg-white/20',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600',
      iconBg: 'bg-white/20',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const style = styles[toast.type];

  return (
    <div
      className={`
        pointer-events-auto
        ${style.bg} text-white rounded-2xl shadow-2xl
        min-w-[380px] max-w-[450px]
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
      `}
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Contenido principal */}
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          {/* Icono grande */}
          <div className={`${style.iconBg} rounded-full p-4 mb-4`}>
            {style.icon}
          </div>
          
          {/* Título */}
          <h3 className="text-xl font-bold text-white mb-2">{toast.title}</h3>
          
          {/* Mensaje */}
          {toast.message && (
            <p className="text-white/90 text-sm leading-relaxed">{toast.message}</p>
          )}
        </div>
      </div>

      {/* Botón de cerrar */}
      <div className="border-t border-white/20 px-6 py-3">
        <button
          onClick={handleClose}
          className="w-full py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-white transition-colors"
        >
          Entendido
        </button>
      </div>

      {/* Barra de progreso animada */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden">
        <div 
          className="h-full bg-white/50 rounded-b-2xl"
          style={{
            animation: `shrink ${toast.duration || 8000}ms linear forwards`,
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

