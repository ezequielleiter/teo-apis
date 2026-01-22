import { z } from 'zod';

// Estados posibles de un incendio
export enum EstadoIncendio {
  ACTIVO = 'activo',
  CONTROLADO = 'controlado',
  EXTINGUIDO = 'extinguido'
}

// Tipo para coordenadas geográficas (OpenStreetMap)
export interface Coordenadas {
  lat: number;
  lng: number;
}

// Tipo para el lugar (ping de OpenStreetMap)
export interface Lugar {
  coordenadas: Coordenadas;
  direccion?: string;
  descripcion?: string;
}

// Tipo para el área (polígono definido por múltiples puntos)
export interface Area {
  puntos: Coordenadas[];
  descripcion?: string;
}

// Interfaz principal del incendio
export interface Incendio {
  id: string;
  lugar: Lugar;
  area?: Area;
  area_mts?: number; // Área calculada en metros cuadrados
  estado: EstadoIncendio;
  fecha_de_registro: Date;
  creado_por?: string; // ID del usuario que registró el incendio
  actualizado_en?: Date;
}

// Schema de validación con Zod para crear un incendio
export const crearIncendioSchema = z.object({
  lugar: z.object({
    coordenadas: z.object({
      lat: z.number().min(-90).max(90, 'Latitud debe estar entre -90 y 90'),
      lng: z.number().min(-180).max(180, 'Longitud debe estar entre -180 y 180')
    }),
    direccion: z.string().optional(),
    descripcion: z.string().optional()
  }),
  area: z.object({
    puntos: z.array(z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    })).min(3, 'El área debe tener al menos 3 puntos para formar un polígono'),
    descripcion: z.string().optional()
  }).optional(),
  estado: z.enum(['activo', 'controlado', 'extinguido']),
  descripcion: z.string().optional()
});

// Schema para actualizar un incendio
export const actualizarIncendioSchema = z.object({
  lugar: z.object({
    coordenadas: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }),
    direccion: z.string().optional(),
    descripcion: z.string().optional()
  }).optional(),
  area: z.object({
    puntos: z.array(z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    })).min(3, 'El área debe tener al menos 3 puntos'),
    descripcion: z.string().optional()
  }).optional(),
  estado: z.enum(['activo', 'controlado', 'extinguido']).optional()
});

// Tipos derivados de los schemas
export type CrearIncendioData = z.infer<typeof crearIncendioSchema>;
export type ActualizarIncendioData = z.infer<typeof actualizarIncendioSchema>;