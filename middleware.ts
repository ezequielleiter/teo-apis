import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Obtener dominios permitidos de variable de entorno
  const allowedOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:3001';
  const originsArray = allowedOrigins.split(',').map(origin => origin.trim());
  const requestOrigin = request.headers.get('origin');
  const requestUrl = new URL(request.url);
  const sameOrigin = !requestOrigin; // Si no hay origin header, es same-origin
  // Determinar si el origen está permitido
  const isOriginAllowed = sameOrigin || originsArray.includes(requestOrigin) || originsArray.includes('*');
  
  const corsOrigin = isOriginAllowed ? (requestOrigin || requestUrl.origin) : 'null';

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

  // Permitir todas las peticiones de API que vengan de orígenes permitidos
  if (pathname.startsWith('/api/')) {
    if (isOriginAllowed) {
      const response = NextResponse.next();
      return createCorsResponse(response);
    } else {
      // Bloquear peticiones de orígenes no permitidos
      return new NextResponse(null, { status: 403 });
    }
  }

  const token = await getToken({ req: request });

  // Permitir acceso a rutas de inicialización sin restricciones adicionales
  if (pathname.startsWith('/api/auth/init-superadmin')) {
    const response = NextResponse.next();
    return createCorsResponse(response);
  }

  if (request.method === 'GET' && pathname.startsWith('/api/admin-buffets/buffet-menu')) {
    const response = NextResponse.next();
    return createCorsResponse(response);
  } 
  // Permitir todas las rutas de NextAuth
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
    '/api/:path*',
    '/admin/:path*', 
    '/dashboard/:path*',
    '/login',
    '/register'
  ]
};