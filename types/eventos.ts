import { z } from 'zod';
import { ObjectId } from 'mongodb';

// Schema para crear un evento
export const crearEventoSchema = z.object({
  nombre: z.string().min(1, 'El nombre del evento es obligatorio'),
  fecha: z.string().datetime('La fecha debe ser válida en formato ISO'),
  buffet_id: z.string().min(1, 'El ID del buffet es obligatorio'),
  user_id: z.string().min(1, 'El ID del usuario es obligatorio'),
  imagen: z.string().url().optional(),
  descripcion: z.string().optional(),
  redes_artista: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    spotify: z.string().optional(),
    youtube: z.string().optional()
  }).optional()
});

// Schema para actualizar un evento
export const actualizarEventoSchema = z.object({
  nombre: z.string().min(1, 'El nombre del evento es obligatorio').optional(),
  fecha: z.string().datetime('La fecha debe ser válida en formato ISO').optional(),
  buffet_id: z.string().min(1, 'El ID del buffet es obligatorio').optional(),
  user_id: z.string().min(1, 'El ID del usuario es obligatorio').optional(),
  imagen: z.string().url().optional(),
  descripcion: z.string().optional(),
  redes_artista: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    spotify: z.string().optional(),
    youtube: z.string().optional()
  }).optional()
});

// Schema para filtros de búsqueda
export const filtrarEventosSchema = z.object({
  nombre: z.string().optional(),
  buffet_id: z.string().optional(),
  user_id: z.string().optional(),
  fecha_desde: z.string().datetime().optional(),
  fecha_hasta: z.string().datetime().optional(),
  limite: z.number().min(1).max(100).optional(),
  pagina: z.number().min(1).optional()
});

// Tipos TypeScript derivados de los schemas
export type CrearEventoData = z.infer<typeof crearEventoSchema>;
export type ActualizarEventoData = z.infer<typeof actualizarEventoSchema>;
export type FiltrarEventosData = z.infer<typeof filtrarEventosSchema>;

// Tipo para el evento completo (incluye campos generados automáticamente)
export interface Evento {
  _id?: string;
  nombre: string;
  fecha: Date;
  buffet_id: string;
  user_id: string;
  imagen?: string;
  descripcion?: string;
  redes_artista?: {
    instagram?: string;
    facebook?: string;
    spotify?: string;
    youtube?: string;
  };
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

// Tipo para evento con datos del buffet populados
export interface EventoConBuffet extends Evento {
  buffet?: {
    _id: string;
    nombre: string;
    lugar: string;
    descripcion: string;
  };
}