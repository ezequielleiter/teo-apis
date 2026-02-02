import { z } from 'zod';

// Schema para crear un banner
export const crearBannerSchema = z.object({
  buffet_id: z.string().min(1, 'El ID del buffet es obligatorio'),
  user_id: z.string().min(1, 'El ID del usuario es obligatorio'),
  mensaje: z.string().min(1, 'El mensaje es obligatorio'),
  link: z.string().url('Link debe ser una URL válida').optional(),
  color: z.string().regex(/^(rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)|#[0-9a-fA-F]{6})$/, 'Color debe ser un valor RGB válido (formato: rgb(255, 255, 255)) o hexadecimal (formato: #000000)')
});

// Schema para filtros de búsqueda
export const filtrarBannersSchema = z.object({
  buffet_id: z.string().optional(),
  user_id: z.string().optional(),
  mensaje: z.string().optional(),
  limite: z.number().min(1).max(100).optional(),
  pagina: z.number().min(1).optional()
});

// Tipos TypeScript derivados de los schemas
export type CrearBannerData = z.infer<typeof crearBannerSchema>;
export type FiltrarBannersData = z.infer<typeof filtrarBannersSchema>;

// Tipo para el banner completo (incluye campos generados automáticamente)
export interface Banner {
  _id?: string;
  buffet_id: string;
  user_id: string;
  mensaje: string;
  link?: string;
  color: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

// Tipo para banner con datos del buffet poblados
export interface BannerConDetalles extends Banner {
  buffet?: {
    _id: string;
    nombre: string;
    lugar: string;
    descripcion: string;
  };
}