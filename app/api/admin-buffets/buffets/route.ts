import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { BuffetsService } from '../../../../lib/buffets';
import { 
  crearBuffetSchema,
  filtrarBuffetsSchema 
} from '../../../../types/buffets';
import { requireAuth } from '../../../../lib/helpers/jwt-auth';

// GET /api/admin-buffets/buffets - Obtener todos los buffets
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['admin', 'superadmin']);
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    
    // Extraer parámetros de consulta
    const filtros: Record<string, unknown> = {};
    
    if (searchParams.get('nombre')) {
      filtros.nombre = searchParams.get('nombre');
    }
    
    if (searchParams.get('lugar')) {
      filtros.lugar = searchParams.get('lugar');
    }
    
    if (searchParams.get('limite')) {
      filtros.limite = parseInt(searchParams.get('limite') || '20');
    }
    
    if (searchParams.get('pagina')) {
      filtros.pagina = parseInt(searchParams.get('pagina') || '1');
    }

    // Validar parámetros
    const filtrosValidados = filtrarBuffetsSchema.parse(filtros);

    // Crear objeto compatible con Session
    const sessionCompatible = { 
      user: {
        ...user,
        role: user.role as any // Cast para compatibilidad
      }, 
      expires: new Date().toISOString() 
    };

    // Obtener buffets
    const resultado = await BuffetsService.obtenerBuffets(filtrosValidados, sessionCompatible);

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('Error al obtener buffets:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Parámetros inválidos', 
          details: error.issues 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/admin-buffets/buffets - Crear un nuevo buffet
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['admin', 'superadmin']);
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;

    const body = await request.json();
    
    // Determinar user_id: usar el enviado si existe, sino el del usuario actual
    const bodyConUserId = {
      ...body,
      user_id: body.user_id || user.id
    };
    
    // Validar datos
    const datosValidados = crearBuffetSchema.parse(bodyConUserId);

    // Crear buffet
    const nuevoBuffet = await BuffetsService.crearBuffet(datosValidados);

    return NextResponse.json(
      { 
        message: 'Buffet creado exitosamente',
        buffet: nuevoBuffet 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error al crear buffet:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: error.issues 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}