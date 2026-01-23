import { z } from 'zod';

// Schema para crear una promo
export const crearPromoSchema = z.object({
  buffet_id: z.string().min(1, 'El ID del buffet es obligatorio'),
  user_id: z.string().min(1, 'El ID del usuario es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  productos: z.array(z.string().min(1, 'ID de producto inválido')).min(1, 'Debe incluir al menos un producto'),
  valor: z.number().min(0, 'El valor debe ser mayor o igual a 0')
});

// Schema para filtros de búsqueda
export const filtrarPromosSchema = z.object({
  buffet_id: z.string().optional(),
  user_id: z.string().optional(),
  nombre: z.string().optional(),
  valor_min: z.number().min(0).optional(),
  valor_max: z.number().min(0).optional(),
  limite: z.number().min(1).max(100).optional(),
  pagina: z.number().min(1).optional()
});

// Tipos TypeScript derivados de los schemas
export type CrearPromoData = z.infer<typeof crearPromoSchema>;
export type FiltrarPromosData = z.infer<typeof filtrarPromosSchema>;

// Tipo para la promo completa (incluye campos generados automáticamente)
export interface Promo {
  _id?: string;
  buffet_id: string;
  user_id: string;
  nombre: string;
  productos: string[]; // Array de product_ids
  valor: number;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

// Tipo para promo con datos del buffet y productos populados
export interface PromoConDetalles extends Promo {
  buffet?: {
    _id: string;
    nombre: string;
    lugar: string;
    descripcion: string;
  };
  productosDetalles?: Array<{
    _id: string;
    nombre: string;
    valor: number;
    descripcion: string;
  }>;
  valorTotalProductos?: number;
  descuento?: number;
}