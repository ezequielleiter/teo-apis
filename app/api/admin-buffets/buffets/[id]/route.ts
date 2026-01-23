/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { actualizarBuffet, eliminarBuffet, obtenerBuffetPorId } from '@/lib/buffets';
import { actualizarBuffetSchema } from '@/types/buffets';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const buffet = await obtenerBuffetPorId(id, session);
    
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
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = actualizarBuffetSchema.parse(body);

    const buffetActualizado = await actualizarBuffet(id, validatedData, session);

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
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await eliminarBuffet(id, session);

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