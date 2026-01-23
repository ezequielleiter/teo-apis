import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Obtener dominios permitidos de variable de entorno
  const allowedOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:3001';
  const originsArray = allowedOrigins.split(',').map(origin => origin.trim());
  const requestOrigin = request.headers.get('origin');

  // Determinar si el origen está permitido
  const isOriginAllowed = !requestOrigin || originsArray.includes(requestOrigin) || originsArray.includes('*');
  const corsOrigin = isOriginAllowed ? (requestOrigin || '*') : 'null';

  // Crear respuesta con headers CORS
  function createCorsResponse(response: NextResponse) {
    if (isOriginAllowed) {
      response.headers.set('Access-Control-Allow-Origin', corsOrigin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    return response;
  }

  // Manejar CORS para peticiones OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return createCorsResponse(response);
  }

  // Agregar headers CORS a respuestas de API
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    return createCorsResponse(response);
  }

  const token = await getToken({ req: request });

  // Permitir acceso a rutas de inicialización sin restricciones
  if (pathname.startsWith('/api/auth/init-superadmin')) {
    const response = NextResponse.next();
    return createCorsResponse(response);
  }

  // Permitir todas las rutas de NextAuth sin modificaciones adicionales
  if (pathname.startsWith('/api/auth/')) {
    const response = NextResponse.next();
    return createCorsResponse(response);
  }

  // Rutas de autenticación - redirigir si ya está autenticado
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Rutas protegidas - redirigir si no está autenticado
  if (pathname.startsWith('/dashboard') && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Para rutas de API que requieren autenticación, verificar inicialización
  if (pathname.startsWith('/api/admin')) {
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
          const response = NextResponse.json(
            { 
              error: 'Sistema no inicializado',
              needsInitialization: true,
              initEndpoint: '/api/auth/init-superadmin'
            },
            { status: 503 }
          );
          return createCorsResponse(response);
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
      const response = NextResponse.next();
      return createCorsResponse(response);
    }

    // Check for valid session token
    const adminToken = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // If no valid token, redirect to login
    if (!adminToken) {
      const loginUrl = new URL('/admin/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      return createCorsResponse(response);
    }
  }

  const response = NextResponse.next();
  return createCorsResponse(response);
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/api/admin/:path*',
    '/api/auth/:path*',
    '/dashboard/:path*',
    '/login',
    '/register'
  ]
};