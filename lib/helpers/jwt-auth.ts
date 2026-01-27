import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth-options';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  buffet_id?: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  buffet_id?: string;
}

export async function verifyJWTFromRequest(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as string,
      buffet_id: payload.buffet_id as string | undefined
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Verifica autenticación usando JWT (aplicaciones externas) o NextAuth (aplicación local)
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  // Intentar autenticación JWT primero (para aplicaciones externas)
  const jwtPayload = await verifyJWTFromRequest(request);
  
  if (jwtPayload) {
    return {
      id: jwtPayload.id,
      email: jwtPayload.email,
      role: jwtPayload.role,
      buffet_id: jwtPayload.buffet_id
    };
  }
  
  // Intentar autenticación NextAuth (para aplicación local)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      buffet_id: session.user.buffet_id
    };
  }
  
  return null;
}

/**
 * Middleware de autenticación que verifica usuario y roles
 */
export async function requireAuth(
  request: NextRequest,
  requiredRoles: string[] = []
): Promise<{ user: AuthUser } | Response> {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return createUnauthorizedResponse();
  }
  
  if (requiredRoles.length > 0 && !hasRequiredRole(user.role, requiredRoles)) {
    return createForbiddenResponse();
  }
  
  return { user };
}

export function hasRequiredRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

export function createUnauthorizedResponse() {
  return Response.json(
    { error: 'No autenticado' },
    { status: 401 }
  );
}

export function createForbiddenResponse() {
  return Response.json(
    { error: 'Permisos insuficientes' },
    { status: 403 }
  );
}