import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { query, queryOne } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { User } from '@/types';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Buscar si el usuario ya existe
          const existingUser = await queryOne<User>(
            'SELECT id, email, role, is_active FROM users WHERE email = ?',
            [user.email]
          );

          if (existingUser) {
            // Usuario existe, verificar que esté activo
            if (!existingUser.is_active) {
              return false; // Usuario inactivo
            }
            return true;
          } else {
            // Crear nuevo usuario
            const name = user.name || user.email?.split('@')[0] || 'Usuario';
            const email = user.email || '';
            
            // Generar contraseña aleatoria (no se usará, pero es requerida en la BD)
            const randomPassword = await hashPassword(Math.random().toString(36));
            
            await query(
              `INSERT INTO users (name, email, password, role, email_verified, is_active, profile_completed, created_at) 
               VALUES (?, ?, ?, 'estudiante', 1, 1, 0, NOW())`,
              [name, email, randomPassword]
            );

            return true;
          }
        } catch (error) {
          console.error('Error en signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === 'google' && user?.email) {
        try {
          // Obtener usuario de la base de datos
          const dbUser = await queryOne<User>(
            'SELECT id, email, role, name, is_active FROM users WHERE email = ? AND is_active = 1',
            [user.email]
          );

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.name = dbUser.name;
            token.email = dbUser.email;
            
            // Actualizar último login
            await query(
              'UPDATE users SET last_login = NOW() WHERE id = ?',
              [dbUser.id]
            );
          }
        } catch (error) {
          console.error('Error obteniendo usuario en JWT:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session as any).user = {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
        };
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirigir a página de callback que establecerá la cookie auth-token
      const callbackUrl = url.startsWith(baseUrl) ? url : baseUrl;
      return `${baseUrl}/auth/callback?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 días
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
