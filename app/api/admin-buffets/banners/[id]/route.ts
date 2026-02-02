/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { obtenerBannerPorId, actualizarBanner, eliminarBanner } from '@/lib/banners';
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

    const banner = await obtenerBannerPorId(id, sessionCompatible);
    
    if (!banner) {
      return NextResponse.json({ error: 'Banner no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ banner });
  } catch (error: any) {
    console.error('Error obteniendo banner:', error);
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

    const bannerActualizado = await actualizarBanner(id, body, sessionCompatible);

    return NextResponse.json({ 
      banner: bannerActualizado,
      message: 'Banner actualizado exitosamente'
    });
  } catch (error: any) {
    console.error('Error actualizando banner:', error);
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

    await eliminarBanner(id, sessionCompatible);

    return NextResponse.json({ 
      message: 'Banner eliminado exitosamente' 
    });
  } catch (error: any) {
    console.error('Error eliminando banner:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}