import { z } from 'zod';

// Schema para crear un buffet
export const crearBuffetSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  lugar: z.string().min(1, 'El lugar es obligatorio'),
  descripcion: z.string().min(1, 'La descripción es obligatoria')
});

// Schema para filtros de búsqueda
export const filtrarBuffetsSchema = z.object({
  nombre: z.string().optional(),
  lugar: z.string().optional(),
  limite: z.number().min(1).max(100).optional(),
  pagina: z.number().min(1).optional()
});

// Tipos TypeScript derivados de los schemas
export type CrearBuffetData = z.infer<typeof crearBuffetSchema>;
export type FiltrarBuffetsData = z.infer<typeof filtrarBuffetsSchema>;

// Tipo para el buffet completo (incluye campos generados automáticamente)
export interface Buffet {
  _id?: string;
  nombre: string;
  lugar: string;
  descripcion: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}