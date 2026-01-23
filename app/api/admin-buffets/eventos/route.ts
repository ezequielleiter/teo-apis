import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ZodError } from 'zod';
import { authOptions } from '../../../../lib/auth-options';
import { EventosService } from '../../../../lib/eventos';
import { 
  crearEventoSchema,
  filtrarEventosSchema 
} from '../../../../types/eventos';

// GET /api/admin-buffets/eventos - Obtener todos los eventos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Extraer parámetros de consulta
    const filtros: Record<string, unknown> = {};
    
    if (searchParams.get('buffet_id')) {
      filtros.buffet_id = searchParams.get('buffet_id');
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

    // Obtener eventos
    const resultado = await EventosService.obtenerEventos(filtrosValidados);

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
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!['admin', 'superadmin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validar datos
    const datosValidados = crearEventoSchema.parse(body);

    // Crear evento
    const nuevoEvento = await EventosService.crearEvento(datosValidados);

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