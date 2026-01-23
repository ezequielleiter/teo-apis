import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth-options';
import { IncendioService } from '../../../lib/incendios';
import { crearIncendioSchema, actualizarIncendioSchema, EstadoIncendio } from '../../../types/incendios';
import { ZodIssue } from 'zod';
import { withAPIAccess } from '../../../lib/helpers/auth-helpers';
import { AvailableAPI } from '../../../types/auth';

// GET /api/incendios - Obtener todos los incendios o filtrar por estado (público)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const id = searchParams.get('id');

    // Si se proporciona un ID, obtener incendio específico
    if (id) {
      const incendio = await IncendioService.obtenerIncendioPorId(id);
      if (!incendio) {
        return NextResponse.json(
          { error: 'Incendio no encontrado' },
          { status: 404 }
        );
      }
      return NextResponse.json({ incendio });
    }

    // Si se proporciona un estado, filtrar por estado
    if (estado && ['activo', 'controlado', 'extinguido'].includes(estado)) {
      const incendios = await IncendioService.obtenerIncendiosPorEstado(estado as EstadoIncendio);
      return NextResponse.json({ incendios });
    }

    // Obtener todos los incendios
    const incendios = await IncendioService.obtenerIncendios();
    return NextResponse.json({ incendios });

  } catch (error) {
    console.error('Error en GET /api/incendios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/incendios - Crear un nuevo incendio
export async function POST(request: NextRequest) {
  try {
    // Verificar permisos de acceso a la API de incendios
    const accessCheck = await withAPIAccess(AvailableAPI.INCENDIOS);
    if (accessCheck.error) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }

    const body = await request.json();
    
    // Validar los datos usando el schema de Zod
    const resultado = crearIncendioSchema.safeParse(body);
    if (!resultado.success) {
      const errores = resultado.error.issues.map((error: ZodIssue) => ({
        campo: error.path.join('.'),
        mensaje: error.message
      }));
      
      return NextResponse.json(
        { error: 'Datos inválidos', errores },
        { status: 400 }
      );
    }

    // Crear el incendio
    const incendio = await IncendioService.crearIncendio(
      resultado.data,
      accessCheck.user?._id
    );

    return NextResponse.json({ 
      message: 'Incendio creado exitosamente',
      incendio 
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/incendios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/incendios - Actualizar un incendio existente
export async function PUT(request: NextRequest) {
  try {
    // Verificar permisos de acceso a la API de incendios
    const accessCheck = await withAPIAccess(AvailableAPI.INCENDIOS);
    if (accessCheck.error) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }

    const body = await request.json();
    const { id, ...datosActualizacion } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID del incendio requerido' },
        { status: 400 }
      );
    }

    // Validar los datos de actualización
    const resultado = actualizarIncendioSchema.safeParse(datosActualizacion);
    if (!resultado.success) {
      const errores = resultado.error.issues.map((error: ZodIssue) => ({
        campo: error.path.join('.'),
        mensaje: error.message
      }));
      
      return NextResponse.json(
        { error: 'Datos inválidos', errores },
        { status: 400 }
      );
    }

    // Actualizar el incendio
    const incendio = await IncendioService.actualizarIncendio(id, resultado.data);
    
    if (!incendio) {
      return NextResponse.json(
        { error: 'Incendio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Incendio actualizado exitosamente',
      incendio 
    });

  } catch (error) {
    console.error('Error en PUT /api/incendios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/incendios - Eliminar un incendio
export async function DELETE(request: NextRequest) {
  try {
    // Verificar permisos de acceso a la API de incendios
    const accessCheck = await withAPIAccess(AvailableAPI.INCENDIOS);
    if (accessCheck.error) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      );
    }

    // Solo SUPERADMIN puede eliminar incendios
    if (accessCheck.user?.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Solo SUPERADMIN puede eliminar incendios' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID del incendio requerido' },
        { status: 400 }
      );
    }

    const eliminado = await IncendioService.eliminarIncendio(id);
    
    if (!eliminado) {
      return NextResponse.json(
        { error: 'Incendio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Incendio eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /api/incendios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}