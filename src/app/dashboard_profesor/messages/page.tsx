'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Inbox,
  Send,
  Mail,
  User,
  Clock,
  Paperclip,
  Trash2,
  Eye,
  Reply,
  Plus,
  AlertCircle
} from 'lucide-react';

interface Message {
  id: number;
  subject: string;
  message: string;
  created_at: string;
  is_read: number;
  sender_name?: string;
  sender_email?: string;
  sender_role?: string;
  recipient_names?: string;
  recipient_emails?: string;
  recipient_roles?: string;
  attachment_count: number;
}

type Tab = 'inbox' | 'sent';

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'inbox') as Tab;

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [activeTab]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/professor/messages?type=${activeTab}`);

      if (!response.ok) {
        setError('Error al cargar los mensajes');
        return;
      }

      const result = await response.json();
      if (result.success) {
        setMessages(result.data || []);
        setUnreadCount(result.unread_count || 0);
      } else {
        setError('Error al cargar los mensajes');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Error al cargar los mensajes');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    router.push(`/dashboard_profesor/messages?tab=${tab}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES');
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'estudiante':
        return 'bg-green-100 text-green-800';
      case 'profesor':
        return 'bg-blue-100 text-blue-800';
      case 'superadmin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Buzón de Entrada</h1>
            <p className="text-gray-600 mt-1">Gestiona tu comunicación con estudiantes y otros profesores</p>
          </div>
          <button
            onClick={() => router.push('/dashboard_profesor/messages/compose')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Mensaje
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => handleTabChange('inbox')}
                className={`px-6 py-4 font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'inbox'
                    ? 'border-b-2 border-green-600 text-green-600 bg-green-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Inbox className="w-5 h-5" />
                Recibidos
                {activeTab === 'inbox' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('sent')}
                className={`px-6 py-4 font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'sent'
                    ? 'border-b-2 border-green-600 text-green-600 bg-green-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Send className="w-5 h-5" />
                Enviados
              </button>
            </div>
          </div>

          <div className="p-6">
            {error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchMessages}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
                >
                  Reintentar
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h5 className="text-lg font-medium text-gray-900 mb-2">No hay mensajes</h5>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'inbox'
                    ? 'No tienes mensajes recibidos.'
                    : 'No has enviado mensajes.'}
                </p>
                {activeTab === 'inbox' && (
                  <button
                    onClick={() => router.push('/dashboard_profesor/messages/compose')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Enviar Primer Mensaje
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isUnread = activeTab === 'inbox' && !message.is_read;
                  const contactName = activeTab === 'inbox'
                    ? message.sender_name
                    : message.recipient_names?.split(', ')[0] || 'Múltiples destinatarios';
                  const contactEmail = activeTab === 'inbox'
                    ? message.sender_email
                    : message.recipient_emails?.split(', ')[0] || '';
                  const contactRole = activeTab === 'inbox'
                    ? message.sender_role
                    : message.recipient_roles?.split(', ')[0] || '';

                  return (
                    <div
                      key={message.id}
                      className={`border rounded-xl p-5 transition-all hover:shadow-md ${
                        isUnread
                          ? 'border-l-4 border-l-green-600 bg-green-50/30'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{message.subject}</h3>
                            {message.attachment_count > 0 && (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs flex items-center gap-1">
                                <Paperclip className="w-3 h-3" />
                                {message.attachment_count}
                              </span>
                            )}
                            {isUnread && (
                              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                                Nuevo
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
                            {activeTab === 'inbox' ? 'De: ' : 'Para: '}
                            <strong>{contactName}</strong>
                            {contactEmail && ` (${contactEmail})`}
                            {contactRole && (
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${getRoleBadgeColor(contactRole)}`}>
                                {contactRole.charAt(0).toUpperCase() + contactRole.slice(1)}
                              </span>
                            )}
                          </p>

                          <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                            {message.message.replace(/<[^>]*>/g, '').substring(0, 100)}
                            {message.message.length > 100 ? '...' : ''}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(message.created_at)}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => router.push(`/dashboard_profesor/messages/${message.id}`)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {activeTab === 'inbox' && (
                            <>
                              <button
                                onClick={() => router.push(`/dashboard_profesor/messages/compose?reply_to=${message.id}`)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Responder"
                              >
                                <Reply className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {/* TODO: Implementar eliminación */}}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    }>
      <MessagesContent />
    </Suspense>
  );
}

