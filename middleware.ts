import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Permitir acceso a rutas de inicialización sin restricciones
  if (pathname.startsWith('/api/auth/init-superadmin')) {
    return NextResponse.next();
  }

  // Para rutas de API que requieren autenticación, verificar inicialización
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/auth/[...nextauth]')) {
    try {
      // Verificar si el sistema está inicializado
      const initResponse = await fetch(new URL('/api/auth/init-superadmin', request.url), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (initResponse.ok) {
        const initStatus = await initResponse.json();
        
        // Si no hay superadmin y no hay usuarios, el sistema necesita inicialización
        if (initStatus.needsInitialization) {
          return NextResponse.json(
            { 
              error: 'Sistema no inicializado',
              needsInitialization: true,
              initEndpoint: '/api/auth/init-superadmin'
            },
            { status: 503 }
          );
        }
      }
    } catch (error) {
      console.error('Error checking initialization status in middleware:', error);
      // Continuar si no se puede verificar el estado
    }
  }

  // Check if the user is trying to access admin routes
  if (pathname.startsWith('/admin')) {
    // Allow access to login page without authentication
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Check for valid session token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // If no valid token, redirect to login
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/auth/:path*']
};