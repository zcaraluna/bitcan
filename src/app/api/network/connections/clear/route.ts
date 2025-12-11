import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { clearAllConnections } from '@/lib/network-connections';

export async function POST(request: NextRequest) {
  try {
    // Solo profesores pueden limpiar las conexiones
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
        { error: 'Acceso denegado. Solo profesores pueden limpiar las conexiones.' },
        { status: 403 }
      );
    }

    // Limpiar todas las conexiones
    const deletedCount = clearAllConnections();

    return NextResponse.json({
      success: true,
      message: `Se eliminaron ${deletedCount} conexiones`,
      deletedCount
    });

  } catch (error) {
    console.error('Error clearing connections:', error);
    return NextResponse.json(
      { error: 'Error al limpiar las conexiones' },
      { status: 500 }
    );
  }
}

