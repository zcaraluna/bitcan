import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';
import { User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validar campos requeridos
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario en la base de datos
    const users = await query<User>(
      'SELECT *, provider FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    const user = users[0];

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Si el usuario viene de Google, el email ya está verificado automáticamente
    // Solo verificamos email_verified para usuarios con provider 'email'
    if (user.provider === 'email' && !user.email_verified) {
      return NextResponse.json(
        { error: 'Por favor verifica tu email antes de iniciar sesión' },
        { status: 403 }
      );
    }

    // Actualizar último login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generar token
    const token = generateToken(user);

    // Preparar datos del usuario (sin contraseña)
    const { password: _, ...userWithoutPassword } = user;

    // Crear respuesta con cookie y token
    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token: token,
    });

    // Configurar cookie HTTP-only
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en login API:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}


