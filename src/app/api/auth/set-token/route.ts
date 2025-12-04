import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { generateToken } from '@/lib/auth';
import { User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Verificar que hay una sesión de NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, email, role } = body;

    // Validar que los datos coinciden con la sesión
    if ((session.user as any).id !== id || session.user.email !== email) {
      return NextResponse.json(
        { success: false, message: 'Datos no coinciden' },
        { status: 403 }
      );
    }

    // Generar token JWT
    const jwtToken = generateToken({
      id,
      email,
      role,
    } as User);

    // Crear respuesta con cookie
    const response = NextResponse.json({
      success: true,
      message: 'Token establecido',
    });

    // Establecer cookie auth-token
    response.cookies.set('auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error estableciendo token:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno' },
      { status: 500 }
    );
  }
}
