/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { obtenerPromoPorId, actualizarPromo, eliminarPromo } from '@/lib/promos';
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

    const promo = await obtenerPromoPorId(id, sessionCompatible);
    
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
    const authResult = await requireAuth(request, ['admin', 'superadmin']);
    const { id } = await params;
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;
    const sessionCompatible = { user };

    const body = await request.json();

    const promoActualizada = await actualizarPromo(id, body, sessionCompatible);

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
    const authResult = await requireAuth(request, ['admin', 'superadmin']);
    const { id } = await params;
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;
    const sessionCompatible = { user };

    await eliminarPromo(id, sessionCompatible);

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