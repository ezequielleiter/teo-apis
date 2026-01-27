/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { obtenerEventoPorId, actualizarEvento, eliminarEvento } from '@/lib/eventos';
import { requireAuth } from '@/lib/helpers/jwt-auth';

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

    const evento = await obtenerEventoPorId(id, sessionCompatible);
    
    if (!evento) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ evento });
  } catch (error: any) {
    console.error('Error obteniendo evento:', error);
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

    const eventoActualizado = await actualizarEvento(id, body, sessionCompatible);

    return NextResponse.json({ 
      evento: eventoActualizado,
      message: 'Evento actualizado exitosamente'
    });
  } catch (error: any) {
    console.error('Error actualizando evento:', error);
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

    await eliminarEvento(id, sessionCompatible);

    return NextResponse.json({ 
      message: 'Evento eliminado exitosamente' 
    });
  } catch (error: any) {
    console.error('Error eliminando evento:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}