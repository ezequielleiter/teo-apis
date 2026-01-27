import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { EventosService } from '../../../../lib/eventos';
import { 
  crearEventoSchema,
  filtrarEventosSchema 
} from '../../../../types/eventos';
import { requireAuth } from '../../../../lib/helpers/jwt-auth';
import { UserRole } from '../../../../types/auth';

// GET /api/admin-buffets/eventos - Obtener todos los eventos
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
    
    if (searchParams.get('buffet_id')) {
      filtros.buffet_id = searchParams.get('buffet_id');
    }

    if (searchParams.get('user_id')) {
      filtros.user_id = searchParams.get('user_id');
    }
    
    if (searchParams.get('fecha_desde')) {
      filtros.fecha_desde = searchParams.get('fecha_desde');
    }
    
    if (searchParams.get('fecha_hasta')) {
      filtros.fecha_hasta = searchParams.get('fecha_hasta');
    }
    
    if (searchParams.get('limite')) {
      filtros.limite = parseInt(searchParams.get('limite') || '20');
    }
    
    if (searchParams.get('pagina')) {
      filtros.pagina = parseInt(searchParams.get('pagina') || '1');
    }

    // Validar parámetros
    const filtrosValidados = filtrarEventosSchema.parse(filtros);

    // Crear objeto compatible con Session
    const sessionCompatible = { 
      user: {
        ...user,
        role: user.role as UserRole // Cast para compatibilidad
      }, 
      expires: new Date().toISOString() 
    };

    // Obtener eventos
    const resultado = await EventosService.obtenerEventos(filtrosValidados, sessionCompatible);

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('Error al obtener eventos:', error);
    
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

// POST /api/admin-buffets/eventos - Crear un nuevo evento
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['admin', 'superadmin']);
    
    if (authResult instanceof Response) {
      return authResult; // Error de autenticación o autorización
    }
    
    const { user } = authResult;

    const body = await request.json();
    
    // Determinar user_id: usar el enviado si existe, sino el del usuario actual
    const bodyConUserId = {
      ...body,
      user_id: body.user_id || user.id
    };
    
    // Validar datos
    const datosValidados = crearEventoSchema.parse(bodyConUserId);

    // Crear objeto compatible con Session
    const sessionCompatible = { 
      user: {
        ...user,
        role: user.role as UserRole // Cast para compatibilidad
      }, 
      expires: new Date().toISOString() 
    };

    // Crear evento
    const nuevoEvento = await EventosService.crearEvento(datosValidados, sessionCompatible);

    return NextResponse.json(
      { 
        message: 'Evento creado exitosamente',
        evento: nuevoEvento 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error al crear evento:', error);
    
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