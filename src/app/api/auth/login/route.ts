import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';
import { User } from '@/types';

export async function POST(request: NextRequest) {
  console.log('🔵🔵🔵 API LOGIN - Request recibido');
  
  try {
    const body = await request.json();
    console.log('📦 Body recibido:', { email: body.email, password: '***' });
    
    const { email, password } = body;

    // Validar campos requeridos
    if (!email || !password) {
      console.log('❌ Campos faltantes');
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }
    
    console.log('✅ Validación inicial OK');

    // Buscar usuario en la base de datos
    console.log('🔍 Buscando usuario en BD...');
    const users = await query<User>(
      'SELECT *, provider FROM users WHERE email = ? AND is_active = 1',
      [email]
    );
    console.log('📊 Usuarios encontrados:', users.length);

    const user = users[0];

    if (!user || !user.password) {
      console.log('❌ Usuario no encontrado o sin password');
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    
    console.log('✅ Usuario encontrado:', { id: user.id, email: user.email, role: user.role });

    // Verificar contraseña
    console.log('🔐 Verificando contraseña...');
    const isValidPassword = await verifyPassword(password, user.password);
    console.log('🔐 Password válido:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta');
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
    console.log('🔑 Generando token JWT...');
    const token = generateToken(user);
    console.log('✅ Token generado (primeros 20 chars):', token.substring(0, 20) + '...');

    // Preparar datos del usuario (sin contraseña)
    const { password: _, ...userWithoutPassword } = user;

    // Crear respuesta con cookie y token
    console.log('📤 Creando respuesta JSON...');
    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token: token,
    });

    // Configurar cookie HTTP-only
    console.log('🍪 Configurando cookie auth-token...');
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('❌❌❌ ERROR EN LOGIN API:', error);
    console.error('❌ Stack:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}


