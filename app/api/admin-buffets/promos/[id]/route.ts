/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { obtenerPromoPorId, actualizarPromo, eliminarPromo } from '@/lib/promos';

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

    const promo = await obtenerPromoPorId(id, session);
    
    if (!promo) {
      return NextResponse.json({ error: 'Promoción no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ promo });
  } catch (error: any) {
    console.error('Error obteniendo promoción:', error);
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

    const promoActualizada = await actualizarPromo(id, body, session);

    return NextResponse.json({ 
      promo: promoActualizada,
      message: 'Promoción actualizada exitosamente'
    });
  } catch (error: any) {
    console.error('Error actualizando promoción:', error);
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

    await eliminarPromo(id, session);

    return NextResponse.json({ 
      message: 'Promoción eliminada exitosamente' 
    });
  } catch (error: any) {
    console.error('Error eliminando promoción:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}