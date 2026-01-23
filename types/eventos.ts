import { z } from 'zod';
import { ObjectId } from 'mongodb';

// Schema para crear un evento
export const crearEventoSchema = z.object({
  fecha: z.string().datetime('La fecha debe ser válida en formato ISO'),
  buffet_id: z.string().min(1, 'El ID del buffet es obligatorio')
});

// Schema para filtros de búsqueda
export const filtrarEventosSchema = z.object({
  buffet_id: z.string().optional(),
  fecha_desde: z.string().datetime().optional(),
  fecha_hasta: z.string().datetime().optional(),
  limite: z.number().min(1).max(100).optional(),
  pagina: z.number().min(1).optional()
});

// Tipos TypeScript derivados de los schemas
export type CrearEventoData = z.infer<typeof crearEventoSchema>;
export type FiltrarEventosData = z.infer<typeof filtrarEventosSchema>;

// Tipo para el evento completo (incluye campos generados automáticamente)
export interface Evento {
  _id?: string;
  fecha: Date;
  buffet_id: string;
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