import { NextRequest, NextResponse } from 'next/server';
import { PuntosDonacionService } from '../../../../lib/puntos-donacion';
import { z, ZodError } from 'zod';

const cercanoSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radio: z.number().positive().max(100).default(10)
});

// GET /api/puntos-donacion/cercanos - Obtener puntos cercanos a una ubicación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const radio = parseFloat(searchParams.get('radio') || '10');

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Los parámetros "lat" y "lng" son obligatorios y deben ser números válidos' },
        { status: 400 }
      );
    }

    // Validar parámetros
    const parametrosValidos = cercanoSchema.parse({ lat, lng, radio });
    
    const puntosCercanos = await PuntosDonacionService.obtenerPuntosCercanos(
      parametrosValidos.lat,
      parametrosValidos.lng,
      parametrosValidos.radio
    );
    
    return NextResponse.json({
      puntos: puntosCercanos,
      total: puntosCercanos.length,
      centro: {
        lat: parametrosValidos.lat,
        lng: parametrosValidos.lng
      },
      radio_km: parametrosValidos.radio
    });
  } catch (error: unknown) {
    console.error('Error en GET /api/puntos-donacion/cercanos:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Parámetros inválidos',
          detalles: error.issues
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}