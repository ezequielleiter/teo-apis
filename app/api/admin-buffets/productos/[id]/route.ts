/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { obtenerProductoPorId, actualizarProducto, eliminarProducto } from '@/lib/productos';
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

    const producto = await obtenerProductoPorId(id, sessionCompatible);
    
    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ producto });
  } catch (error: any) {
    console.error('Error obteniendo producto:', error);
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

    const productoActualizado = await actualizarProducto(id, body, sessionCompatible);

    return NextResponse.json({ 
      producto: productoActualizado,
      message: 'Producto actualizado exitosamente'
    });
  } catch (error: any) {
    console.error('Error actualizando producto:', error);
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

    await eliminarProducto(id, sessionCompatible);

    return NextResponse.json({ 
      message: 'Producto eliminado exitosamente' 
    });
  } catch (error: any) {
    console.error('Error eliminando producto:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}