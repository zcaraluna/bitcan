'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState<'email' | 'password' | 'general' | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      setErrorField('general');
      return;
    }

    setIsLoading(true);
    setError('');
    setErrorField(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // Redirigir según el rol
        if (data.user.role === 'superadmin') {
          window.location.href = '/dashboard_superadmin';
        } else if (data.user.role === 'profesor') {
          window.location.href = '/dashboard_profesor';
        } else {
          window.location.href = '/dashboard_estudiante';
        }
      } else {
        if (data.error && data.error.includes('verifica tu email')) {
          setError(data.error);
          setErrorField('email');
        } else {
          setError(data.error || 'Credenciales inválidas');
          setErrorField('general');
        }
      }
    } catch (err: any) {
      setError('Error de conexión con el servidor');
      setErrorField('general');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    setErrorField(null);

    try {
      // Redirigir a NextAuth para iniciar sesión con Google
      await signIn('google', {
        callbackUrl: '/dashboard_estudiante',
      });
    } catch (err: any) {
      setError('Error de conexión con Google');
      setErrorField('general');
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      alert('Por favor, ingresa tu email primero.');
      return;
    }

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Correo de verificación reenviado exitosamente. Revisa tu bandeja de entrada.');
      } else {
        alert(data.error || 'Error al reenviar el correo de verificación.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión. Intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-[450px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Image
              src="/bitcan-logo.png"
              alt="BITCAN"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="text-2xl font-extrabold font-display">BITCAN</span>
          </div>
          <h1 className="text-2xl font-semibold mb-2">Acceso a Cursos</h1>
          <p className="text-sm opacity-90">
            Inicia sesión o regístrate para acceder a nuestros cursos de ciberseguridad
          </p>
        </div>

        {/* Contenido */}
        <div className="p-8">
          {/* Tabs */}
          <div className="flex mb-8 rounded-xl bg-gray-100 p-1">
            <div className="flex-1 text-center py-3 px-4 rounded-lg bg-white text-sky-500 font-medium shadow-sm cursor-pointer">
              Iniciar Sesión
            </div>
            <div className="flex-1 text-center py-3 px-4 rounded-lg text-gray-500 opacity-50 cursor-not-allowed" title="Registro manual temporalmente deshabilitado">
              Registrarse
            </div>
          </div>

          {/* Botón de Google */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-xl p-5 mb-5 text-center shadow-lg">
              <div className="flex items-center justify-center mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" className="mr-2 animate-pulse">
                  <path fill="white" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="text-white font-semibold text-base">Acceso Recomendado</span>
              </div>
              <p className="text-white/90 text-sm leading-relaxed">
                Más rápido, más seguro y sin necesidad de recordar contraseñas
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white border-none py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 mb-5"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" className="mr-3 bg-white p-0.5 rounded">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>
          </div>

          {/* Separador */}
          <div className="relative text-center my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative bg-white px-5">
              <span className="text-gray-500 font-medium text-sm">o continúa con</span>
            </div>
          </div>

          {/* Formulario de Login */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="loginEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all ${
                  errorField === 'email' || errorField === 'general'
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-sky-500 focus:ring-sky-100'
                } focus:outline-none focus:ring-4`}
                placeholder="tu@email.com"
                disabled={isLoading}
                required
              />
              {errorField === 'email' && error && (
                <div className="mt-2 text-sm text-red-600">
                  {error}
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="ml-2 text-sky-600 hover:text-sky-700 underline font-medium"
                  >
                    ¿Reenviar correo de verificación?
                  </button>
                </div>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="loginPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-base transition-all ${
                    errorField === 'password' || errorField === 'general'
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-sky-500 focus:ring-sky-100'
                  } focus:outline-none focus:ring-4`}
                  placeholder="Tu contraseña"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error general */}
            {errorField === 'general' && error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Botón de login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>

            {/* Enlaces de ayuda */}
            <div className="text-center space-y-2">
              <div>
                <button
                  type="button"
                  onClick={() => alert('Funcionalidad de recuperación de contraseña en desarrollo...')}
                  className="text-sky-600 hover:text-sky-700 text-sm font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="text-gray-500 hover:text-gray-700 text-xs"
                >
                  ¿No recibiste el correo de verificación?
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-6 text-center">
          <p className="text-gray-600 text-sm">
            Al continuar, aceptas nuestros{' '}
            <Link href="#" className="text-sky-600 hover:text-sky-700 underline">
              Términos y Condiciones
            </Link>
            {' '}y{' '}
            <Link href="#" className="text-sky-600 hover:text-sky-700 underline">
              Política de Privacidad
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
