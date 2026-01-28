import { z } from 'zod';

// Enum para estados de orden
export enum EstadoOrden {
  PENDIENTE = 'pendiente',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado'
}

// Enum para formas de pago
export enum FormaPago {
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia'
}

// Schema para item de producto en la orden
export const itemProductoSchema = z.object({
  tipo: z.enum(['producto', 'promo']),
  id: z.string().min(1, 'El ID es obligatorio'),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0').default(1),
  precio_unitario: z.number().min(0, 'El precio unitario debe ser mayor o igual a 0')
});

// Schema para crear una orden
export const crearOrdenSchema = z.object({
  buffet_id: z.string().min(1, 'El ID del buffet es obligatorio'),
  evento_id: z.string().min(1, 'El ID del evento es obligatorio'),
  user_id: z.string().min(1, 'El ID del usuario es obligatorio'),
  cliente_nombre: z.string().min(1, 'El nombre del cliente es obligatorio'),
  productos: z.array(itemProductoSchema).min(1, 'Debe incluir al menos un producto o promo'),
  total: z.number().min(0, 'El total debe ser mayor o igual a 0'),
  forma_pago: z.nativeEnum(FormaPago),
  nota: z.string().optional(),
  estado: z.nativeEnum(EstadoOrden).default(EstadoOrden.PENDIENTE)
});

// Schema para filtros de búsqueda
export const filtrarOrdenesSchema = z.object({
  buffet_id: z.string().optional(),
  evento_id: z.string().optional(),
  user_id: z.string().optional(),
  estado: z.nativeEnum(EstadoOrden).optional(),
  forma_pago: z.nativeEnum(FormaPago).optional(),
  nota: z.string().optional(),
  fecha_desde: z.string().datetime().optional(),
  fecha_hasta: z.string().datetime().optional(),
  total_min: z.number().min(0).optional(),
  total_max: z.number().min(0).optional(),
  limite: z.number().min(1).max(100).optional(),
  pagina: z.number().min(1).optional()
});

// Schema para actualizar estado de orden
export const actualizarEstadoOrdenSchema = z.object({
  estado: z.nativeEnum(EstadoOrden)
});

// Tipos TypeScript derivados de los schemas
export type ItemProducto = z.infer<typeof itemProductoSchema>;
export type CrearOrdenData = z.infer<typeof crearOrdenSchema>;
export type FiltrarOrdenesData = z.infer<typeof filtrarOrdenesSchema>;
export type ActualizarEstadoOrdenData = z.infer<typeof actualizarEstadoOrdenSchema>;

// Tipo para la orden completa (incluye campos generados automáticamente)
export interface Orden {
  _id?: string;
  buffet_id: string;
  evento_id: string;
  user_id: string;
  cliente_nombre: string;
  productos: ItemProducto[];
  productosExpandidos: ProductoExpandido[]; // Productos con detalles expandidos
  total: number;
  forma_pago: FormaPago;
  nota?: string;
  estado: EstadoOrden;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

// Tipo para producto expandido (incluye todos los productos individuales)
export interface ProductoExpandido {
  producto_id: string;
  nombre: string;
  descripcion: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  origen: {
    tipo: 'producto' | 'promo';
    id: string;
    nombre: string;
  };
}

// Tipo para orden con datos del buffet y evento populados
export interface OrdenConDetalles extends Orden {
  buffet?: {
    _id: string;
    nombre: string;
    lugar: string;
    descripcion: string;
  };
  evento?: {
    _id: string;
    fecha: Date;
  };
}