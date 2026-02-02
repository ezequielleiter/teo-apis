import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { BannersService } from '../../../../lib/banners';
import { 
  crearBannerSchema,
  filtrarBannersSchema 
} from '../../../../types/banners';
import { requireAuth } from '../../../../lib/helpers/jwt-auth';
import { UserRole } from '../../../../types/auth';

// GET /api/admin-buffets/banners - Obtener todos los banners
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
   
    const authResult = await requireAuth(request, ['admin', 'superadmin']);

    if (authResult instanceof Response) {
      return authResult; // Error de autenticación o autorización
    }
    
    const { user } = authResult;

    // Extraer parámetros de consulta
    const filtros: Record<string, unknown> = {};
    
    if (searchParams.get('buffet_id')) {
      filtros.buffet_id = searchParams.get('buffet_id');
    }
    
    if (searchParams.get('mensaje')) {
      filtros.mensaje = searchParams.get('mensaje');
    }
    
    if (searchParams.get('user_id')) {
      filtros.user_id = searchParams.get('user_id');
    }
    
    if (searchParams.get('limite')) {
      filtros.limite = parseInt(searchParams.get('limite') || '20');
    }
    
    if (searchParams.get('pagina')) {
      filtros.pagina = parseInt(searchParams.get('pagina') || '1');
    }

    // Validar parámetros
    const filtrosValidados = filtrarBannersSchema.parse(filtros);

    // Crear objeto compatible con Session
    const sessionCompatible = { 
      user: {
        ...user,
        role: user.role as UserRole // Cast para compatibilidad con UserRole enum
      }, 
      expires: new Date().toISOString() 
    };

    // Obtener banners
    const resultado = await BannersService.obtenerBanners(filtrosValidados, sessionCompatible);

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('Error al obtener banners:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Parámetros inválidos', 
          details: error.issues 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/admin-buffets/banners - Crear un nuevo banner
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['admin', 'superadmin']);
    
    if (authResult instanceof Response) {
      return authResult; // Error de autenticación o autorización
    }
    
    const { user } = authResult;

    const body = await request.json();
    
    // Agregar user_id del usuario actual
    const bodyConUserId = {
      ...body,
      user_id: user.id
    };
    
    // Validar datos
    const datosValidados = crearBannerSchema.parse(bodyConUserId);
    
    // Crear banner
    const nuevoBanner = await BannersService.crearBanner(datosValidados, authResult);

    return NextResponse.json(
      { 
        message: 'Banner creado exitosamente',
        banner: nuevoBanner 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error al crear banner:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: error.issues 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}