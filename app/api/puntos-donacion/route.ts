import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { PuntosDonacionService } from '../../../lib/puntos-donacion';
import { 
  crearPuntoDonacionSchema, 
  filtrarPuntosDonacionSchema 
} from '../../../types/puntos-donacion';
import { withAPIAccess } from '../../../lib/helpers/auth-helpers';
import { AvailableAPI } from '../../../types/auth';

// GET /api/puntos-donacion - Obtener puntos de donación con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extraer parámetros de consulta
    const filtros: Record<string, unknown> = {};
    
    if (searchParams.get('tipo_de_org')) {
      filtros.tipo_de_org = searchParams.get('tipo_de_org');
    }
    
    if (searchParams.get('insumos')) {
      filtros.insumos = searchParams.get('insumos')?.split(',');
    }
    
    if (searchParams.get('aprobado')) {
      filtros.aprobado = searchParams.get('aprobado') === 'true';
    }
    
    if (searchParams.get('limite')) {
      filtros.limite = parseInt(searchParams.get('limite') || '50');
    }
    
    if (searchParams.get('pagina')) {
      filtros.pagina = parseInt(searchParams.get('pagina') || '1');
    }

    // Validar filtros
    const filtrosValidos = filtrarPuntosDonacionSchema.parse(filtros);
    
    const resultado = await PuntosDonacionService.obtenerPuntos(filtrosValidos);
    
    return NextResponse.json(resultado);
  } catch (error: unknown) {
    console.error('Error en GET /api/puntos-donacion:', error);
    
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

// POST /api/puntos-donacion - Crear nuevo punto de donación
export async function POST(request: NextRequest) {
  try {
    // Verificar permisos de acceso a la API de puntos de donación
    const accessCheck = await withAPIAccess(AvailableAPI.PUNTOS_DONACION);
    if (accessCheck.error) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }

    const body = await request.json();
    
    // Validar datos de entrada
    const datosValidos = crearPuntoDonacionSchema.parse(body);
    
    const puntoId = await PuntosDonacionService.crearPunto(
      datosValidos, 
      accessCheck.user?._id || 'unknown'
    );
    
    return NextResponse.json(
      { 
        mensaje: 'Punto de donación creado exitosamente',
        id: puntoId
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error en POST /api/puntos-donacion:', error);
    
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