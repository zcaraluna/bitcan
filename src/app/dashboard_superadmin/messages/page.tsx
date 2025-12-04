'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Inbox, 
  Send, 
  Mail, 
  MailOpen,
  Plus, 
  Reply,
  Trash2,
  User,
  Clock,
  Search,
  X
} from 'lucide-react';

interface Message {
  id: number;
  sender_id: number;
  subject: string;
  message: string;
  created_at: string;
  is_read: boolean;
  sender_name: string;
  sender_email: string;
  sender_role: string;
  recipients?: string;
  parent_message_id?: number;
}

interface UserOption {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [showMessageView, setShowMessageView] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    loadMessages();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/messages?type=${activeTab}&page=${page}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setTotalPages(data.totalPages);
      } else {
        setError('Error al cargar mensajes');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/messages/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleViewMessage = async (message: Message) => {
    setSelectedMessage(message);
    setShowMessageView(true);
    
    // Marcar como leído si es de la bandeja de entrada
    if (activeTab === 'inbox' && !message.is_read) {
      try {
        await fetch(`/api/admin/messages/${message.id}/read`, {
          method: 'PATCH',
        });
        loadMessages();
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab }),
      });

      if (response.ok) {
        setSuccess('Mensaje eliminado exitosamente');
        loadMessages();
        if (showMessageView) {
          setShowMessageView(false);
          setSelectedMessage(null);
        }
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al eliminar mensaje');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Error de conexión');
    }
  };

  const filteredMessages = messages.filter(message => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      message.subject.toLowerCase().includes(search) ||
      message.message.toLowerCase().includes(search) ||
      message.sender_name.toLowerCase().includes(search) ||
      (message.recipients && message.recipients.toLowerCase().includes(search))
    );
  });

  const unreadCount = messages.filter(m => !m.is_read && activeTab === 'inbox').length;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Mail className="w-8 h-8 text-gray-600" />
                Buzón de Mensajes
              </h1>
              <p className="text-gray-600 mt-1">Administra tu comunicación con usuarios del sistema</p>
            </div>
            <button
              onClick={() => { setSelectedMessage(null); setShowCompose(true); }}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Mensaje
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200">
          {/* Tabs y búsqueda */}
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between p-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => { setActiveTab('inbox'); setPage(1); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'inbox'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  Bandeja de Entrada
                  {unreadCount > 0 && activeTab === 'inbox' && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setActiveTab('sent'); setPage(1); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'sent'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Enviados
                </button>
              </div>
              
              <div className="flex items-center gap-2 w-64">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar mensajes..."
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Lista de mensajes */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {filteredMessages.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !message.is_read && activeTab === 'inbox' ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleViewMessage(message)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {!message.is_read && activeTab === 'inbox' ? (
                            <Mail className="w-5 h-5 text-blue-600" />
                          ) : (
                            <MailOpen className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  {activeTab === 'inbox' ? message.sender_name : message.recipients || 'Destinatarios'}
                                </span>
                                {!message.is_read && activeTab === 'inbox' && (
                                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full" />
                                )}
                              </div>
                              <h3 className="font-semibold text-gray-900 mb-1">{message.subject}</h3>
                              <p className="text-sm text-gray-600 line-clamp-2">{message.message}</p>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {new Date(message.created_at).toLocaleString('es-PY', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMessage(message.id);
                                }}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">
                    {activeTab === 'inbox' ? 'No hay mensajes recibidos' : 'No hay mensajes enviados'}
                  </h3>
                  <p className="text-sm">
                    {activeTab === 'inbox' 
                      ? 'Los mensajes que recibas aparecerán aquí.'
                      : 'Los mensajes que envíes aparecerán aquí.'}
                  </p>
                </div>
              )}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Componer Mensaje */}
      {showCompose && (
        <ComposeMessageModal
          users={users}
          replyTo={selectedMessage}
          onSend={() => {
            // Solo refrescar la lista y cerrar el modal
            setSuccess('Mensaje enviado exitosamente');
            setShowCompose(false);
            setSelectedMessage(null);
            loadMessages();
            setTimeout(() => setSuccess(''), 5000);
          }}
          onClose={() => {
            setShowCompose(false);
            setSelectedMessage(null);
          }}
        />
      )}

      {/* Modal de Ver Mensaje */}
      {showMessageView && selectedMessage && (
        <ViewMessageModal
          message={selectedMessage}
          onReply={() => {
            setShowMessageView(false);
            setShowCompose(true);
          }}
          onDelete={() => handleDeleteMessage(selectedMessage.id)}
          onClose={() => {
            setShowMessageView(false);
            setSelectedMessage(null);
          }}
          messageType={activeTab}
        />
      )}
    </DashboardLayout>
  );
}

// Modal de Componer Mensaje
interface ComposeMessageModalProps {
  users: UserOption[];
  replyTo: Message | null;
  onSend: () => void;
  onClose: () => void;
}

function ComposeMessageModal({ users, replyTo, onSend, onClose }: ComposeMessageModalProps) {
  const [formData, setFormData] = useState({
    recipient_ids: replyTo ? [replyTo.sender_id] : [],
    subject: replyTo ? `Re: ${replyTo.subject}` : '',
    message: '',
  });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar usuarios basado en el término de búsqueda
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Enviar mensaje primero
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parent_message_id: replyTo?.id || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar mensaje');
      }

      const result = await response.json();
      const messageId = result.id;
      console.log('📧 Mensaje enviado, ID:', messageId);

      // Si hay archivos adjuntos, subirlos
      if (attachedFiles.length > 0 && messageId) {
        console.log('📎 Subiendo archivos adjuntos...', attachedFiles.length, 'archivos');
        
        for (const file of attachedFiles) {
          console.log('📎 Subiendo archivo:', file.name, 'para mensaje:', messageId);
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          uploadFormData.append('messageId', messageId.toString());

          const uploadResponse = await fetch('/api/admin/messages/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          if (!uploadResponse.ok) {
            console.error('❌ Error subiendo archivo:', file.name, uploadResponse.status);
          } else {
            const uploadResult = await uploadResponse.json();
            console.log('✅ Archivo subido:', file.name, uploadResult);
          }
        }
      }

      // Llamar al callback original para refrescar la lista
      onSend();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Limpiar búsqueda al cerrar
  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  const toggleRecipient = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      recipient_ids: prev.recipient_ids.includes(userId)
        ? prev.recipient_ids.filter(id => id !== userId)
        : [...prev.recipient_ids, userId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {replyTo ? 'Responder Mensaje' : 'Nuevo Mensaje'}
            </h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {!replyTo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destinatarios *
                    </label>
                    
                    {/* Buscador */}
                    <div className="mb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre, email o rol..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* Lista de usuarios filtrados */}
                    <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <div key={user.id} className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              checked={formData.recipient_ids.includes(user.id)}
                              onChange={() => toggleRecipient(user.id)}
                              className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                            />
                            <label className="text-sm text-gray-900 cursor-pointer flex-1">
                              <span className="font-medium">{user.name}</span> 
                              <span className="text-gray-500">({user.email})</span> - 
                              <span className="text-gray-500">{user.role}</span>
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No se encontraron usuarios
                        </div>
                      )}
                    </div>
                    
                    {formData.recipient_ids.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.recipient_ids.length} destinatario(s) seleccionado(s)
                      </p>
                    )}
                  </div>
                )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asunto *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            />
          </div>

          {/* Archivos adjuntos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivos Adjuntos
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
              <input
                type="file"
                onChange={handleFileSelect}
                multiple
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center text-center"
              >
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600">
                  Haz clic para seleccionar archivos o arrastra y suelta
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  PDF, PNG, JPG, DOCX, XLSX (máx. 10MB por archivo)
                </span>
              </label>
            </div>

            {/* Lista de archivos seleccionados */}
            {attachedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Mensaje
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de Ver Mensaje
interface ViewMessageModalProps {
  message: Message;
  onReply: () => void;
  onDelete: () => void;
  onClose: () => void;
  messageType: 'inbox' | 'sent';
}

function ViewMessageModal({ message, onReply, onDelete, onClose, messageType }: ViewMessageModalProps) {
  const [attachments, setAttachments] = useState<any[]>([]);

  useEffect(() => {
    // Cargar archivos adjuntos
    const loadAttachments = async () => {
      try {
        console.log('📎 Loading attachments for message:', message.id);
        const response = await fetch(`/api/admin/messages/${message.id}/attachments`);
        console.log('📎 Attachments response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📎 Attachments data:', data);
          setAttachments(data.attachments || []);
        } else {
          console.error('📎 Error loading attachments:', response.status);
        }
      } catch (error) {
        console.error('Error loading attachments:', error);
      }
    };

    loadAttachments();
  }, [message.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Ver Mensaje</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                {messageType === 'inbox' ? (
                  <>
                    <span className="text-gray-600">De:</span>
                    <div className="font-medium text-gray-900">{message.sender_name}</div>
                    <div className="text-gray-500 text-xs">{message.sender_email}</div>
                  </>
                ) : (
                  <>
                    <span className="text-gray-600">Para:</span>
                    <div className="font-medium text-gray-900">
                      {message.recipients || 'Destinatarios'}
                    </div>
                  </>
                )}
              </div>
              <div>
                <span className="text-gray-600">Fecha:</span>
                <div className="font-medium text-gray-900">
                  {new Date(message.created_at).toLocaleString('es-PY')}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{message.subject}</h3>
            <div className="text-gray-700 whitespace-pre-wrap">{message.message}</div>
          </div>

          {/* Archivos adjuntos */}
          {attachments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Archivos Adjuntos ({attachments.length})
              </h4>
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{attachment.original_name}</p>
                        <p className="text-xs text-gray-500">
                          {(attachment.file_size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onDelete}
              className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cerrar
              </button>
              {/* Solo mostrar botón Responder si es un mensaje recibido */}
              {messageType === 'inbox' && (
                <button
                  onClick={onReply}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Reply className="w-4 h-4" />
                  Responder
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
