import { z } from 'zod';

// Schema para crear un producto
export const crearProductoSchema = z.object({
  buffet_id: z.string().min(1, 'El ID del buffet es obligatorio'),
  user_id: z.string().min(1, 'El ID del usuario es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  valor: z.number().min(0, 'El valor debe ser mayor o igual a 0'),
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  imagen: z.string().url().optional(),
  disponible: z.boolean().optional().default(true)
});

// Schema para actualizar un producto
export const actualizarProductoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').optional(),
  valor: z.number().min(0, 'El valor debe ser mayor o igual a 0').optional(),
  descripcion: z.string().min(1, 'La descripción es obligatoria').optional(),
  imagen: z.string().url().optional(),
  disponible: z.boolean().optional()
});

// Schema para filtros de búsqueda
export const filtrarProductosSchema = z.object({
  buffet_id: z.string().optional(),
  user_id: z.string().optional(),
  nombre: z.string().optional(),
  valor_min: z.number().min(0).optional(),
  valor_max: z.number().min(0).optional(),
  limite: z.number().min(1).max(100).optional(),
  pagina: z.number().min(1).optional()
});

// Tipos TypeScript derivados de los schemas
export type CrearProductoData = z.infer<typeof crearProductoSchema>;
export type ActualizarProductoData = z.infer<typeof actualizarProductoSchema>;
export type FiltrarProductosData = z.infer<typeof filtrarProductosSchema>;

// Tipo para el producto completo (incluye campos generados automáticamente)
export interface Producto {
  _id?: string;
  buffet_id: string;
  user_id: string;
  nombre: string;
  valor: number;
  descripcion: string;
  imagen?: string;
  disponible: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

// Tipo para producto con datos del buffet populados
export interface ProductoConBuffet extends Producto {
  buffet?: {
    _id: string;
    nombre: string;
    lugar: string;
    descripcion: string;
  };
}