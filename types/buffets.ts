import { z } from 'zod';

// Schema para crear un buffet
export const crearBuffetSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  lugar: z.string().min(1, 'El lugar es obligatorio'),
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  user_id: z.string().min(1, 'El ID del usuario es obligatorio'),
  redes_sociales: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    whatsapp: z.string().optional()
  }).optional(),
  logo: z.string().optional()
});

// Schema para actualizar un buffet
export const actualizarBuffetSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').optional(),
  lugar: z.string().min(1, 'El lugar es obligatorio').optional(),
  descripcion: z.string().min(1, 'La descripción es obligatoria').optional(),
  user_id: z.string().min(1, 'El ID del usuario es obligatorio').optional(),
  redes_sociales: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    whatsapp: z.string().optional()
  }).optional(),
  logo: z.string().optional()
});

// Schema para filtros de búsqueda
export const filtrarBuffetsSchema = z.object({
  nombre: z.string().optional(),
  lugar: z.string().optional(),
  user_id: z.string().optional(),
  limite: z.number().min(1).max(100).optional(),
  pagina: z.number().min(1).optional()
});

// Tipos TypeScript derivados de los schemas
export type CrearBuffetData = z.infer<typeof crearBuffetSchema>;
export type ActualizarBuffetData = z.infer<typeof actualizarBuffetSchema>;
export type FiltrarBuffetsData = z.infer<typeof filtrarBuffetsSchema>;

// Tipo para el buffet completo (incluye campos generados automáticamente)
export interface Buffet {
  _id?: string;
  nombre: string;
  lugar: string;
  descripcion: string;
  user_id: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  redes_sociales?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
  logo?: string;
}