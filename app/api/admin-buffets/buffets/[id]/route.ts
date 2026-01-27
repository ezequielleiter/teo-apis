/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { actualizarBuffet, eliminarBuffet, obtenerBuffetPorId } from '@/lib/buffets';
import { actualizarBuffetSchema } from '@/types/buffets';
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

    const buffet = await obtenerBuffetPorId(id, sessionCompatible);
    
    if (!buffet) {
      return NextResponse.json({ error: 'Buffet no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ buffet });
  } catch (error: any) {
    console.error('Error obteniendo buffet:', error);
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
    const validatedData = actualizarBuffetSchema.parse(body);

    const buffetActualizado = await actualizarBuffet(id, validatedData, sessionCompatible);

    return NextResponse.json({ 
      buffet: buffetActualizado,
      message: 'Buffet actualizado exitosamente'
    });
  } catch (error: any) {
    console.error('Error actualizando buffet:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Datos inválidos',
        details: error.errors
      }, { status: 400 });
    }
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

    const eliminado = await eliminarBuffet(id, sessionCompatible);

    if (!eliminado) {
      return NextResponse.json({ 
        error: 'No se pudo eliminar el buffet' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      message: 'Buffet eliminado exitosamente' 
    });
  } catch (error: any) {
    console.error('Error eliminando buffet:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}