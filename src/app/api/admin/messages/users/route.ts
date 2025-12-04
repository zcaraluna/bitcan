import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Obtener lista de usuarios para enviar mensajes
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Obtener usuarios (excluyendo al usuario actual)
    const users = await query(`
      SELECT id, name, email, role 
      FROM users 
      WHERE id != ? AND role IN ('estudiante', 'profesor', 'superadmin')
      ORDER BY role ASC, name ASC
    `, [decoded.id.toString()]);

    return NextResponse.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


