// Almacenamiento en memoria de conexiones activas
// Este módulo se carga una vez y mantiene el estado en memoria

interface ConnectionData {
  sessionId: string;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  ip: string;
  networkInfo: any;
  userAgent: string;
  connectedAt: Date;
  lastActivity: Date;
}

const activeConnections = new Map<string, ConnectionData>();

// Limpiar conexiones inactivas (lazy cleanup - solo cuando se accede)
function cleanupInactiveConnections() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  for (const [sessionId, conn] of activeConnections.entries()) {
    if (conn.lastActivity < oneHourAgo) {
      activeConnections.delete(sessionId);
    }
  }
}

export function getActiveConnections(): ConnectionData[] {
  cleanupInactiveConnections();
  return Array.from(activeConnections.values());
}

export function getConnection(sessionId: string): ConnectionData | undefined {
  cleanupInactiveConnections();
  return activeConnections.get(sessionId);
}

export function setConnection(sessionId: string, data: Omit<ConnectionData, 'sessionId' | 'connectedAt'>): void {
  const existing = activeConnections.get(sessionId);
  
  activeConnections.set(sessionId, {
    ...data,
    sessionId,
    connectedAt: existing?.connectedAt || new Date(),
    lastActivity: new Date()
  });
  
  // Limpiar periódicamente (cada 10 conexiones)
  if (activeConnections.size % 10 === 0) {
    cleanupInactiveConnections();
  }
}

export function deleteConnection(sessionId: string): void {
  activeConnections.delete(sessionId);
}

export function getConnectionCount(): number {
  cleanupInactiveConnections();
  return activeConnections.size;
}

