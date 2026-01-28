import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ZodError } from 'zod';
import { authOptions } from '../../../../lib/auth-options';
import { PuntosDonacionService } from '../../../../lib/puntos-donacion';
import { 
  crearPuntoDonacionSchema,
  filtrarPuntosDonacionSchema 
} from '../../../../types/puntos-donacion';

// GET /api/admin/puntos-donacion - Obtener todos los puntos (incluyendo no aprobados)
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
    
    // Extraer parámetros de consulta (similar al endpoint público pero sin restricción de aprobación)
    const filtros: Record<string, unknown> = {};
    
    if (searchParams.get('tipo_de_org')) {
      filtros.tipo_de_org = searchParams.get('tipo_de_org');
    }
    
    if (searchParams.get('insumos')) {
      filtros.insumos = searchParams.get('insumos')?.split(',');
    }
    
    // En el admin, permitir filtrar por aprobado/no aprobado
    if (searchParams.get('aprobado') !== null) {
      filtros.aprobado = searchParams.get('aprobado') === 'true';
    }
    
    if (searchParams.get('limite')) {
      filtros.limite = parseInt(searchParams.get('limite') || '50');
    }
    
    if (searchParams.get('pagina')) {
      filtros.pagina = parseInt(searchParams.get('pagina') || '1');
    }

    const filtrosValidos = filtrarPuntosDonacionSchema.parse(filtros);
    
    const resultado = await PuntosDonacionService.obtenerPuntos(filtrosValidos);
    
    return NextResponse.json(resultado);
  } catch (error: unknown) {
    console.error('Error en GET /api/admin/puntos-donacion:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Parámetros de consulta inválidos',
          detalles: error.issues
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

// POST /api/admin/puntos-donacion - Crear punto de donación desde admin (pre-aprobado)
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
    
    // Para admin, el punto puede crearse pre-aprobado
    const datosConAprobacion = {
      ...body,
      aprobado: body.aprobado !== undefined ? body.aprobado : true // Por defecto aprobado desde admin
    };
    
    const datosValidos = crearPuntoDonacionSchema.parse(datosConAprobacion);
    
    const puntoId = await PuntosDonacionService.crearPunto(
      datosValidos, 
      session.user.id
    );
    
    return NextResponse.json(
      { 
        mensaje: 'Punto de donación creado exitosamente desde administración',
        id: puntoId
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error en POST /api/admin/puntos-donacion:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          detalles: error.issues
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