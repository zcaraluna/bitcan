import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@/types';
import { query } from './db';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'default-secret-change-in-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const users = await query<User>(
      'SELECT id, name, email, password, role, email_verified, is_active, profile_completed, last_login, created_at FROM users WHERE email = ? AND is_active = 1',
      [email]
    );
    
    return users[0] || null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const users = await query<User>(
      'SELECT id, name, email, role, email_verified, is_active, profile_completed, last_login, created_at FROM users WHERE id = ? AND is_active = 1',
      [id]
    );
    
    return users[0] || null;
  } catch (error) {
    console.error('Error fetching user by id:', error);
    return null;
  }
}

export async function updateLastLogin(userId: number): Promise<void> {
  try {
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [userId]
    );
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

export async function authenticateUser(email: string, password: string): Promise<{ user: User | null; error?: string }> {
  try {
    // Buscar usuario por email
    const user = await getUserByEmail(email);
    
    if (!user) {
      return { user: null, error: 'Credenciales inválidas' };
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, (user as any).password);
    
    if (!isValidPassword) {
      return { user: null, error: 'Credenciales inválidas' };
    }

    // Remover password del objeto user
    const { password: _, ...userWithoutPassword } = user as any;
    
    // Actualizar último login
    await updateLastLogin(user.id);

    return { user: userWithoutPassword };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: 'Error interno del servidor' };
  }
}

export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: { [key: string]: number } = {
    estudiante: 1,
    profesor: 2,
    superadmin: 3,
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}


