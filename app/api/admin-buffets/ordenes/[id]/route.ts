/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { obtenerOrdenPorId, actualizarOrden, eliminarOrden } from '@/lib/ordenes';
import { requireAuth } from '@/lib/helpers/jwt-auth';
import { obtenerBuffetsPorCliente } from '@/lib/buffets';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['admin', 'superadmin']);
    const { id } = await params;
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;
    const sessionCompatible = { user };

    const orden = await obtenerOrdenPorId(id, sessionCompatible);
    
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ orden });
  } catch (error: any) {
    console.error('Error obteniendo orden:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const authResult = await requireAuth(request, ['admin', 'superadmin']);
    const { id } = await params;
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;
    const sessionCompatible = { user };

    const body = await request.json();

    const ordenActualizada = await actualizarOrden(id, body, sessionCompatible);

    return NextResponse.json({ 
      orden: ordenActualizada,
      message: 'Orden actualizada exitosamente'
    });
  } catch (error: any) {
    console.error('Error actualizando orden:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['admin', 'superadmin']);
    const { id } = await params;
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;
    const sessionCompatible = { user };

    await eliminarOrden(id, sessionCompatible);

    return NextResponse.json({ 
      message: 'Orden eliminada exitosamente' 
    });
  } catch (error: any) {
    console.error('Error eliminando orden:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}