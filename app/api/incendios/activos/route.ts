import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-options';
import { IncendioService } from '../../../../lib/incendios';

// GET /api/incendios/activos - Obtener solo los incendios activos (público)
export async function GET(request: NextRequest) {
  try {
    const incendiosActivos = await IncendioService.obtenerIncendiosActivos();
    
    return NextResponse.json({ 
      incendios: incendiosActivos,
      total: incendiosActivos.length
    });

  } catch (error) {
    console.error('Error en GET /api/incendios/activos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}