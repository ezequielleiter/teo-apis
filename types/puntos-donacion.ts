import { z } from 'zod';

// Tipos de organización
export enum TipoOrganizacion {
  PARTICULAR = 'particular',
  COOPERATIVA = 'cooperativa',
  CLUB = 'club',
  CIVIL = 'civil',
  MUTUAL = 'mutual'
}

// Tipos de insumos
export enum TipoInsumo {
  AGUA = 'agua',
  DINERO = 'dinero',
  COMIDA = 'comida',
  ROPA = 'ropa',
  ANTEOJOS_PROTECCION = 'anteojos de protección',
  COLIRIO = 'colirio',
  ROPA_IGNIFUGA = 'ropa ignífuga',
  BORCEGOS = 'borcegos',
  MAMELUCOS = 'mamelucos',
  MERCADERIA_VIANDAS = 'mercadería para viandas',
  MUCHA_AGUA = 'mucha agua',
  INSUMOS_PRIMEROS_AUXILIOS = 'insumos de primeros auxilios',
  HERRAMIENTAS_PALA_HACHA = 'herramientas: pala, hacha, motosierra',
  MACHETE = 'machete',
  GUANTES = 'guantes',
  MOCHILAS_HIDRANTES = 'mochilas hidrantes',
  MEDIAS = 'medias',
  LINTERNAS = 'linternas',
  CUELLITOS = 'cuellitos para tapar boca y nariz',
  BORCEGOS_CANA_ALTA = 'borcegos de caña alta y de cuero',
  CADENAS_MOTOSIERRA = 'cadenas para motosierras',
  CASCOS_DERRUMBES = 'cascos por derrumbes'
}

// Tipo para coordenadas geográficas (igual que en incendios)
export interface Coordenadas {
  lat: number;
  lng: number;
}

// Tipo para el lugar (igual que en incendios)
export interface Lugar {
  coordenadas: Coordenadas;
  direccion?: string;
  descripcion?: string;
}

// Tipo para horarios de atención
export interface Horarios {
  lunes?: string;
  martes?: string;
  miercoles?: string;
  jueves?: string;
  viernes?: string;
  sabado?: string;
  domingo?: string;
  observaciones?: string;
}

// Interfaz principal del punto de donación
export interface PuntoDonacion {
  id: string;
  nombre: string;
  nombre_de_responsable: string;
  lugar: Lugar;
  telefono: string;
  whatsapp?: string;
  tipo_de_org: TipoOrganizacion;
  insumos: TipoInsumo[];
  horarios?: Horarios;
  aprobado: boolean;
  fecha_de_registro: Date;
  creado_por?: string; // ID del usuario que registró el punto
  actualizado_en?: Date;
}

// Schema de validación con Zod para crear un punto de donación
export const crearPuntoDonacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  nombre_de_responsable: z.string().min(1, 'El nombre del responsable es obligatorio'),
  lugar: z.object({
    coordenadas: z.object({
      lat: z.number().min(-90).max(90, 'Latitud debe estar entre -90 y 90'),
      lng: z.number().min(-180).max(180, 'Longitud debe estar entre -180 y 180')
    }),
    direccion: z.string().optional(),
    descripcion: z.string().optional()
  }),
  telefono: z.string().min(1, 'El teléfono es obligatorio'),
  whatsapp: z.string().optional(),
  tipo_de_org: z.enum(['particular', 'cooperativa', 'club', 'civil', 'mutual']),
  insumos: z.array(z.nativeEnum(TipoInsumo))
    .min(1, 'Debe seleccionar al menos un tipo de insumo'),
  horarios: z.object({
    lunes: z.string().optional(),
    martes: z.string().optional(),
    miercoles: z.string().optional(),
    jueves: z.string().optional(),
    viernes: z.string().optional(),
    sabado: z.string().optional(),
    domingo: z.string().optional(),
    observaciones: z.string().optional()
  }).optional(),
  aprobado: z.boolean().default(false)
});

// Schema para actualizar un punto de donación
export const actualizarPuntoDonacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').optional(),
  nombre_de_responsable: z.string().min(1, 'El nombre del responsable es obligatorio').optional(),
  lugar: z.object({
    coordenadas: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }),
    direccion: z.string().optional(),
    descripcion: z.string().optional()
  }).optional(),
  telefono: z.string().min(1, 'El teléfono es obligatorio').optional(),
  whatsapp: z.string().optional(),
  tipo_de_org: z.enum(['particular', 'cooperativa', 'club', 'civil', 'mutual']).optional(),
  insumos: z.array(z.nativeEnum(TipoInsumo))
    .min(1, 'Debe seleccionar al menos un tipo de insumo').optional(),
  horarios: z.object({
    lunes: z.string().optional(),
    martes: z.string().optional(),
    miercoles: z.string().optional(),
    jueves: z.string().optional(),
    viernes: z.string().optional(),
    sabado: z.string().optional(),
    domingo: z.string().optional(),
    observaciones: z.string().optional()
  }).optional(),
  aprobado: z.boolean().optional()
});

// Schema para filtrar puntos de donación
export const filtrarPuntosDonacionSchema = z.object({
  tipo_de_org: z.enum(['particular', 'cooperativa', 'club', 'civil', 'mutual']).optional(),
  insumos: z.array(z.nativeEnum(TipoInsumo)).optional(),
  aprobado: z.boolean().optional(),
  limite: z.number().positive().max(100).default(50),
  pagina: z.number().positive().default(1)
});

// Tipos derivados de los schemas
export type CrearPuntoDonacionData = z.infer<typeof crearPuntoDonacionSchema>;
export type ActualizarPuntoDonacionData = z.infer<typeof actualizarPuntoDonacionSchema>;
export type FiltrarPuntosDonacionData = z.infer<typeof filtrarPuntosDonacionSchema>;