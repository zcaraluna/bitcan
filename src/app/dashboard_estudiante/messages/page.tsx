'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MessageSquare, Send, User, Calendar, Paperclip } from 'lucide-react';

interface Message {
  id: number;
  subject: string;
  content: string;
  sender_name: string;
  sender_role: string;
  created_at: string;
  is_read: boolean;
  attachments?: string[];
}

export default function MisMensajes() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/student/messages');
        if (response.ok) {
          const data = await response.json();
          setMessages(data.data || []);
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

    fetchMessages();
  }, []);

  const handleMarkAsRead = async (messageId: number) => {
    try {
      const response = await fetch(`/api/student/messages/${messageId}/read`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, is_read: true } : msg
          )
        );
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(prev => prev ? { ...prev, is_read: true } : null);
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              Reintentar
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-lg p-8">
            <h1 className="text-4xl font-bold mb-2">Mis Mensajes</h1>
            <p className="text-blue-50 text-lg">Comunicación con profesores y administradores</p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{messages.length}</div>
              <div className="text-sm text-gray-600">Total Mensajes</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-orange-600 font-bold text-sm">{unreadCount}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{unreadCount}</div>
              <div className="text-sm text-gray-600">No Leídos</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {messages.filter(m => {
                  const messageDate = new Date(m.created_at);
                  const now = new Date();
                  const diffTime = Math.abs(now.getTime() - messageDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays <= 7;
                }).length}
              </div>
              <div className="text-sm text-gray-600">Esta Semana</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de mensajes */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Bandeja de Entrada</h2>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {messages.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          onClick={() => {
                            setSelectedMessage(message);
                            if (!message.is_read) {
                              handleMarkAsRead(message.id);
                            }
                          }}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedMessage?.id === message.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                          } ${!message.is_read ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className={`font-medium ${!message.is_read ? 'font-bold' : ''}`}>
                              {message.subject}
                            </h3>
                            {!message.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {message.content}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {message.sender_name}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(message.created_at).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No tienes mensajes</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vista del mensaje */}
            <div className="lg:col-span-2">
              {selectedMessage ? (
                <div className="bg-white rounded-xl border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">{selectedMessage.subject}</h2>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {new Date(selectedMessage.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">De: {selectedMessage.sender_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {selectedMessage.sender_role}
                        </span>
                      </div>
                    </div>

                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
                    </div>

                    {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Archivos adjuntos:</h4>
                        <div className="space-y-2">
                          {selectedMessage.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                              <Paperclip className="w-4 h-4" />
                              <span>{attachment}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un mensaje</h3>
                  <p className="text-gray-600">Elige un mensaje de la lista para ver su contenido</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

