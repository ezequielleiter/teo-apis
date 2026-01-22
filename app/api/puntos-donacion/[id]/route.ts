import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ZodError } from 'zod';
import { authOptions } from '../../../../lib/auth-options';
import { PuntosDonacionService } from '../../../../lib/puntos-donacion';
import { actualizarPuntoDonacionSchema } from '../../../../types/puntos-donacion';

// GET /api/puntos-donacion/[id] - Obtener punto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const punto = await PuntosDonacionService.obtenerPuntoPorId(id);
    
    if (!punto) {
      return NextResponse.json(
        { error: 'Punto de donación no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(punto);
  } catch (error: unknown) {
    console.error('Error en GET /api/puntos-donacion/[id]:', error);
    
    if (error instanceof Error && error.message.includes('inválido')) {
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

// PUT /api/puntos-donacion/[id] - Actualizar punto por ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validar datos de entrada
    const datosValidos = actualizarPuntoDonacionSchema.parse(body);
    
    const actualizado = await PuntosDonacionService.actualizarPunto(
      id,
      datosValidos
    );
    
    if (!actualizado) {
      return NextResponse.json(
        { error: 'Punto de donación no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      mensaje: 'Punto de donación actualizado exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en PUT /api/puntos-donacion/[id]:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          detalles: error.issues
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message.includes('inválido')) {
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

// DELETE /api/puntos-donacion/[id] - Eliminar punto por ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo SUPERADMIN puede eliminar puntos
    if (session.user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const eliminado = await PuntosDonacionService.eliminarPunto(id);
    
    if (!eliminado) {
      return NextResponse.json(
        { error: 'Punto de donación no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      mensaje: 'Punto de donación eliminado exitosamente'
    });
  } catch (error: unknown) {
    console.error('Error en DELETE /api/puntos-donacion/[id]:', error);
    
    if (error instanceof Error && error.message.includes('inválido')) {
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