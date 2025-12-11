import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Almacenamiento en memoria de conexiones activas
// En producción, podrías usar Redis o similar para múltiples instancias
const activeConnections = new Map<string, {
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
}>();

// Limpiar conexiones inactivas cada minuto
setInterval(() => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  for (const [sessionId, conn] of activeConnections.entries()) {
    if (conn.lastActivity < oneHourAgo) {
      activeConnections.delete(sessionId);
    }
  }
}, 60000); // Cada minuto

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, networkInfo } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId es requerido' },
        { status: 400 }
      );
    }

    // Obtener IP del cliente
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';

    // Intentar obtener usuario si está logueado
    let userId = null;
    let userName = null;
    let userEmail = null;
    let userRole = null;
    
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        userId = decoded.id;
        // Intentar obtener más info del usuario (opcional, puede hacer fetch a /api/auth/me si necesitas más datos)
        userName = (decoded as any).name || null;
        userEmail = decoded.email || null;
        userRole = decoded.role || null;
      }
    }

    // Actualizar o crear conexión en memoria
    activeConnections.set(sessionId, {
      sessionId,
      userId,
      userName,
      userEmail,
      userRole,
      ip: clientIP,
      networkInfo: networkInfo || {},
      userAgent,
      connectedAt: activeConnections.get(sessionId)?.connectedAt || new Date(),
      lastActivity: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Conexión registrada exitosamente'
    });

  } catch (error) {
    console.error('Error registering connection:', error);
    return NextResponse.json(
      { error: 'Error al registrar la conexión' },
      { status: 500 }
    );
  }
}

// Exportar el Map para que pueda ser accedido desde otras rutas
export { activeConnections };
