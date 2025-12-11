import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { setConnection } from '@/lib/network-connections';

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
        userName = (decoded as any).name || null;
        userEmail = decoded.email || null;
        userRole = decoded.role || null;
      }
    }

    // Actualizar o crear conexión en memoria
    setConnection(sessionId, {
      userId,
      userName,
      userEmail,
      userRole,
      ip: clientIP,
      networkInfo: networkInfo || {},
      userAgent,
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
