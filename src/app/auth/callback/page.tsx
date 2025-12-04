'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

function AuthCallbackContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard_estudiante';

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.user) {
      // Generar token JWT y establecer cookie
      const user = session.user as any;
      
      if (user.id && user.email && user.role) {
        // Llamar al endpoint para establecer el token
        fetch('/api/auth/set-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.role,
          }),
        }).then((res) => res.json()).then((data) => {
          if (data.success) {
            // Redirigir según el rol
            if (user.role === 'superadmin') {
              window.location.href = '/dashboard_superadmin';
            } else if (user.role === 'profesor') {
              window.location.href = '/dashboard_profesor';
            } else {
              window.location.href = '/dashboard_estudiante';
            }
          } else {
            router.push('/login?error=token_set_failed');
          }
        }).catch(() => {
          router.push('/login?error=token_set_failed');
        });
      } else {
        router.push('/login?error=invalid_session');
      }
    } else if (status === 'unauthenticated') {
      router.push('/login?error=auth_failed');
    }
  }, [status, session, router, callbackUrl]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Completando inicio de sesión...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
