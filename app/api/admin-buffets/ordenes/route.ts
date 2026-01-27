import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { OrdenesService } from '../../../../lib/ordenes';
import { 
  crearOrdenSchema,
  filtrarOrdenesSchema,
  EstadoOrden,
  FormaPago
} from '../../../../types/ordenes';
import { requireAuth } from '../../../../lib/helpers/jwt-auth';

// GET /api/admin-buffets/ordenes - Obtener todas las órdenes
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
    
    if (searchParams.get('buffet_id')) {
      filtros.buffet_id = searchParams.get('buffet_id');
    }
    
    if (searchParams.get('evento_id')) {
      filtros.evento_id = searchParams.get('evento_id');
    }
    
    if (searchParams.get('estado')) {
      const estado = searchParams.get('estado');
      if (Object.values(EstadoOrden).includes(estado as EstadoOrden)) {
        filtros.estado = estado;
      }
    }
    
    if (searchParams.get('forma_pago')) {
      const formaPago = searchParams.get('forma_pago');
      if (Object.values(FormaPago).includes(formaPago as FormaPago)) {
        filtros.forma_pago = formaPago;
      }
    }
    
    if (searchParams.get('nota')) {
      filtros.nota = searchParams.get('nota');
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
    
    if (searchParams.get('total_min')) {
      filtros.total_min = parseFloat(searchParams.get('total_min') || '0');
    }
    
    if (searchParams.get('total_max')) {
      filtros.total_max = parseFloat(searchParams.get('total_max') || '0');
    }
    
    if (searchParams.get('limite')) {
      filtros.limite = parseInt(searchParams.get('limite') || '20');
    }
    
    if (searchParams.get('pagina')) {
      filtros.pagina = parseInt(searchParams.get('pagina') || '1');
    }

    // Validar parámetros
    const filtrosValidados = filtrarOrdenesSchema.parse(filtros);

    // Crear objeto compatible con Session
    const sessionCompatible = { 
      user: {
        ...user,
        role: user.role
      }, 
      expires: new Date().toISOString() 
    };

    // Obtener órdenes
    const resultado = await OrdenesService.obtenerOrdenes(filtrosValidados, sessionCompatible);

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    
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

// POST /api/admin-buffets/ordenes - Crear una nueva orden
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['admin', 'superadmin']);
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;

    const body = await request.json();
    
    // Agregar user_id del usuario actual
    const bodyConUserId = {
      ...body,
      user_id: user.id
    };
    
    // Validar datos
    const datosValidados = crearOrdenSchema.parse(bodyConUserId);

    // Crear objeto compatible con Session
    const sessionCompatible = { 
      user: {
        ...user,
        role: user.role
      }, 
      expires: new Date().toISOString() 
    };

    // Crear orden
    const nuevaOrden = await OrdenesService.crearOrden(datosValidados, sessionCompatible);

    return NextResponse.json(
      { 
        message: 'Orden creada exitosamente',
        orden: nuevaOrden 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error al crear orden:', error);
    
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