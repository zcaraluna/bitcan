import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getActiveConnections } from '@/lib/network-connections';

export async function GET(request: NextRequest) {
  try {
    // Solo profesores pueden ver la lista de conexiones
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'profesor') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo profesores pueden ver las conexiones.' },
        { status: 403 }
      );
    }

    // Obtener conexiones activas (la limpieza se hace automáticamente)
    const connections = getActiveConnections();

    // Convertir a formato de respuesta
    const formattedConnections = connections.map(conn => ({
      id: conn.sessionId,
      session_id: conn.sessionId,
      user_id: conn.userId,
      ip_address: conn.ip,
      isp: conn.networkInfo?.isp || null,
      organization: conn.networkInfo?.organization || null,
      country: conn.networkInfo?.country || null,
      region: conn.networkInfo?.region || null,
      city: conn.networkInfo?.city || null,
      timezone: conn.networkInfo?.timezone || null,
      is_vpn: conn.networkInfo?.is_vpn ? 1 : 0,
      is_proxy: conn.networkInfo?.is_proxy ? 1 : 0,
      is_tor: conn.networkInfo?.is_tor ? 1 : 0,
      latitude: conn.networkInfo?.latitude || null,
      longitude: conn.networkInfo?.longitude || null,
      user_agent: conn.userAgent,
      connected_at: conn.connectedAt.toISOString(),
      last_activity: conn.lastActivity.toISOString(),
      user_name: conn.userName,
      user_email: conn.userEmail,
      user_role: conn.userRole
    }));

    // Ordenar por última actividad (más reciente primero)
    formattedConnections.sort((a, b) => 
      new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
    );

    return NextResponse.json({
      success: true,
      data: formattedConnections
    });

  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Error al obtener las conexiones' },
      { status: 500 }
    );
  }
}
