import { z } from 'zod';

// Categorías de elementos de comparación
export enum CategoriaComparacion {
  ESTADIOS = 'estadios',
  MONUMENTOS = 'monumentos',
  CIUDADES = 'ciudades',
  PAISES = 'paises',
  ESTRUCTURAS = 'estructuras'
}

// Interfaz para elementos de referencia
export interface ElementoComparacion {
  id: string;
  nombre: string;
  categoria: CategoriaComparacion;
  superficie: number; // en hectáreas
  descripcion: string;
  imagen?: string;
  pais?: string;
  ciudad?: string;
  datos_adicionales?: {
    capacidad?: number;
    altura?: number;
    año_construccion?: number;
    poblacion?: number;
  };
}

// Datos de elementos de referencia predefinidos
export const ELEMENTOS_COMPARACION: ElementoComparacion[] = [
  // Estadios
  {
    id: 'cancha-river',
    nombre: 'Cancha de River Plate (El Monumental)',
    categoria: CategoriaComparacion.ESTADIOS,
    superficie: 10.5, // hectáreas
    descripcion: 'El estadio más grande de Argentina',
    pais: 'Argentina',
    ciudad: 'Buenos Aires',
    datos_adicionales: {
      capacidad: 83214,
      año_construccion: 1938
    }
  },
  {
    id: 'la-bombonera',
    nombre: 'La Bombonera (Boca Juniors)',
    categoria: CategoriaComparacion.ESTADIOS,
    superficie: 2.4,
    descripcion: 'Icónico estadio de Boca Juniors',
    pais: 'Argentina',
    ciudad: 'Buenos Aires',
    datos_adicionales: {
      capacidad: 54000,
      año_construccion: 1940
    }
  },
  {
    id: 'maracana',
    nombre: 'Estadio Maracaná',
    categoria: CategoriaComparacion.ESTADIOS,
    superficie: 19.5,
    descripcion: 'Famoso estadio de Río de Janeiro',
    pais: 'Brasil',
    ciudad: 'Río de Janeiro',
    datos_adicionales: {
      capacidad: 78838,
      año_construccion: 1950
    }
  },
  {
    id: 'camp-nou',
    nombre: 'Camp Nou',
    categoria: CategoriaComparacion.ESTADIOS,
    superficie: 10.7,
    descripcion: 'Estadio del FC Barcelona',
    pais: 'España',
    ciudad: 'Barcelona',
    datos_adicionales: {
      capacidad: 99354,
      año_construccion: 1957
    }
  },
  
  // Monumentos
  {
    id: 'obelisco-ba',
    nombre: 'Obelisco de Buenos Aires',
    categoria: CategoriaComparacion.MONUMENTOS,
    superficie: 0.006, // Aproximadamente 60 m²
    descripcion: 'Símbolo icónico de Buenos Aires',
    pais: 'Argentina',
    ciudad: 'Buenos Aires',
    datos_adicionales: {
      altura: 67.5,
      año_construccion: 1936
    }
  },
  {
    id: 'piramide-keops',
    nombre: 'Pirámide de Keops (Gran Pirámide)',
    categoria: CategoriaComparacion.MONUMENTOS,
    superficie: 5.29, // Base cuadrada de 230m x 230m
    descripcion: 'Una de las Siete Maravillas del Mundo Antiguo',
    pais: 'Egipto',
    ciudad: 'Giza',
    datos_adicionales: {
      altura: 146.5,
      año_construccion: -2580
    }
  },
  {
    id: 'torre-eiffel',
    nombre: 'Torre Eiffel',
    categoria: CategoriaComparacion.MONUMENTOS,
    superficie: 1.54, // Base cuadrada
    descripcion: 'Símbolo de París y Francia',
    pais: 'Francia',
    ciudad: 'París',
    datos_adicionales: {
      altura: 330,
      año_construccion: 1889
    }
  },
  
  // Estructuras
  {
    id: 'vaticano',
    nombre: 'Ciudad del Vaticano',
    categoria: CategoriaComparacion.ESTRUCTURAS,
    superficie: 44,
    descripcion: 'El país más pequeño del mundo',
    pais: 'Vaticano',
    datos_adicionales: {
      poblacion: 825
    }
  },
  {
    id: 'plaza-mayo',
    nombre: 'Plaza de Mayo',
    categoria: CategoriaComparacion.ESTRUCTURAS,
    superficie: 1.6,
    descripcion: 'Plaza histórica de Buenos Aires',
    pais: 'Argentina',
    ciudad: 'Buenos Aires',
    datos_adicionales: {
      año_construccion: 1580
    }
  },
  
  // Ciudades pequeñas para referencia
  {
    id: 'puerto-madero',
    nombre: 'Puerto Madero',
    categoria: CategoriaComparacion.ESTRUCTURAS,
    superficie: 170,
    descripcion: 'Barrio portuario de Buenos Aires',
    pais: 'Argentina',
    ciudad: 'Buenos Aires'
  },
  {
    id: 'centro-ba',
    nombre: 'Microcentro Porteño',
    categoria: CategoriaComparacion.CIUDADES,
    superficie: 2600, // Aproximado
    descripcion: 'Centro histórico de Buenos Aires',
    pais: 'Argentina',
    ciudad: 'Buenos Aires'
  },
  
  // Referencias más grandes
  {
    id: 'caba',
    nombre: 'Ciudad Autónoma de Buenos Aires',
    categoria: CategoriaComparacion.CIUDADES,
    superficie: 20000,
    descripcion: 'Capital Federal Argentina',
    pais: 'Argentina',
    datos_adicionales: {
      poblacion: 3100000
    }
  },
  {
    id: 'manhattan',
    nombre: 'Manhattan',
    categoria: CategoriaComparacion.CIUDADES,
    superficie: 5950,
    descripcion: 'Distrito de Nueva York',
    pais: 'Estados Unidos',
    ciudad: 'Nueva York',
    datos_adicionales: {
      poblacion: 1630000
    }
  }
];

// Schema de validación
export const ComparacionSchema = z.object({
  superficie_incendio: z.number().positive(),
  elementos_comparacion: z.array(z.string())
});

export type ComparacionInput = z.infer<typeof ComparacionSchema>;

// Función para obtener elementos de comparación apropiados según la superficie
export function obtenerElementosApropiados(superficie: number): ElementoComparacion[] {
  // Ordenar elementos por superficie
  const elementosOrdenados = [...ELEMENTOS_COMPARACION].sort((a, b) => a.superficie - b.superficie);
  
  // Buscar elementos que sean apropiados para la comparación
  const elementosApropiados: ElementoComparacion[] = [];
  
  // Agregar elementos más pequeños (hasta 10x más pequeño)
  const elementosMenores = elementosOrdenados.filter(el => 
    el.superficie <= superficie && el.superficie >= superficie / 10
  );
  
  // Agregar elementos similares (0.5x a 2x el tamaño)
  const elementosSimilares = elementosOrdenados.filter(el => 
    el.superficie >= superficie * 0.5 && el.superficie <= superficie * 2
  );
  
  // Agregar elementos más grandes (hasta 5x más grande)
  const elementosMayores = elementosOrdenados.filter(el => 
    el.superficie > superficie && el.superficie <= superficie * 5
  );
  
  // Combinar y limitar resultados
  elementosApropiados.push(...elementosMenores.slice(-2)); // Últimos 2 menores
  elementosApropiados.push(...elementosSimilares.slice(0, 3)); // Primeros 3 similares
  elementosApropiados.push(...elementosMayores.slice(0, 2)); // Primeros 2 mayores
  
  // Si no hay suficientes, agregar algunos aleatorios
  if (elementosApropiados.length < 5) {
    const restantes = elementosOrdenados.filter(el => !elementosApropiados.includes(el));
    elementosApropiados.push(...restantes.slice(0, 5 - elementosApropiados.length));
  }
  
  return elementosApropiados.slice(0, 6); // Máximo 6 elementos
}