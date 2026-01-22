import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../lib/auth-options';
import { PuntosDonacionService } from '../../../../../lib/puntos-donacion';

// PATCH /api/puntos-donacion/[id]/aprobar - Cambiar estado de aprobación
export async function PATCH(
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

    // Solo ADMIN y SUPERADMIN pueden aprobar puntos
    if (!['superadmin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { aprobado } = body;

    if (typeof aprobado !== 'boolean') {
      return NextResponse.json(
        { error: 'El campo "aprobado" debe ser un valor booleano' },
        { status: 400 }
      );
    }

    const actualizado = await PuntosDonacionService.cambiarAprobacion(
      id,
      aprobado
    );
    
    if (!actualizado) {
      return NextResponse.json(
        { error: 'Punto de donación no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      mensaje: `Punto de donación ${aprobado ? 'aprobado' : 'desaprobado'} exitosamente`
    });
  } catch (error: unknown) {
    console.error('Error en PATCH /api/puntos-donacion/[id]/aprobar:', error);
    
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