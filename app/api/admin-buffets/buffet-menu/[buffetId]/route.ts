/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { obtenerMenuBuffet } from '@/lib/buffet-menu';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ buffetId: string }> }
) {
  try {
    const { buffetId } = await params;

    const menu = await obtenerMenuBuffet(buffetId);

    if (!menu.buffet) {
      return NextResponse.json({ error: 'Buffet no encontrado' }, { status: 404 });
    }

    return NextResponse.json(menu);
  } catch (error: any) {
    console.error('Error obteniendo menú del buffet:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}
