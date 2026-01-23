import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ZodError } from 'zod';
import { authOptions } from '../../../../lib/auth-options';
import { BuffetsService } from '../../../../lib/buffets';
import { 
  crearBuffetSchema,
  filtrarBuffetsSchema 
} from '../../../../types/buffets';

// GET /api/admin-buffets/buffets - Obtener todos los buffets
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

    // Obtener buffets
    const resultado = await BuffetsService.obtenerBuffets(filtrosValidados, session);

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
    
    // Agregar user_id del usuario actual
    const bodyConUserId = {
      ...body,
      user_id: session.user.id
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