import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

interface SessionData {
  id: number;
  session_id: string;
  ip: string;
  isp?: string;
  country?: string;
  city?: string;
  is_vpn?: boolean;
  is_proxy?: boolean;
  user_agent?: string;
  accessed_at: string;
  last_activity: string;
}

// POST - Registrar o actualizar sesión
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, network_info, user_agent } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id es requerido' },
        { status: 400 }
      );
    }

    // Obtener IP del cliente
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = forwarded?.split(',')[0].trim() || realIP || 'unknown';

    // Verificar si la sesión ya existe
    const existingSession = await queryOne(`
      SELECT id FROM network_sessions
      WHERE session_id = ?
    `, [session_id]);

    const now = new Date();

    if (existingSession) {
      // Actualizar sesión existente
      await query(`
        UPDATE network_sessions
        SET ip = ?, isp = ?, country = ?, city = ?, is_vpn = ?, is_proxy = ?,
            user_agent = ?, last_activity = ?
        WHERE session_id = ?
      `, [
        clientIP,
        network_info?.isp || null,
        network_info?.country || null,
        network_info?.city || null,
        network_info?.is_vpn ? 1 : 0,
        network_info?.is_proxy ? 1 : 0,
        user_agent || null,
        now
      ]);
    } else {
      // Crear nueva sesión
      await query(`
        INSERT INTO network_sessions (session_id, ip, isp, country, city, is_vpn, is_proxy, user_agent, accessed_at, last_activity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        session_id,
        clientIP,
        network_info?.isp || null,
        network_info?.country || null,
        network_info?.city || null,
        network_info?.is_vpn ? 1 : 0,
        network_info?.is_proxy ? 1 : 0,
        user_agent || null,
        now,
        now
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Sesión registrada'
    });

  } catch (error) {
    console.error('Error registering session:', error);
    return NextResponse.json(
      { error: 'Error al registrar la sesión' },
      { status: 500 }
    );
  }
}

// GET - Obtener lista de sesiones (solo profesores)
export async function GET(request: NextRequest) {
  try {
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
        { error: 'Acceso denegado. Solo profesores pueden ver las sesiones.' },
        { status: 403 }
      );
    }

    // Obtener sesiones activas (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const sessions = await query(`
      SELECT 
        id,
        session_id,
        ip,
        isp,
        country,
        city,
        is_vpn,
        is_proxy,
        user_agent,
        accessed_at,
        last_activity
      FROM network_sessions
      WHERE last_activity >= ?
      ORDER BY last_activity DESC
    `, [fiveMinutesAgo]);

    return NextResponse.json({
      success: true,
      data: sessions
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Error al obtener las sesiones' },
      { status: 500 }
    );
  }
}

