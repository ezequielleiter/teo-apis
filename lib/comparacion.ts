import { 
  ElementoComparacion, 
  ELEMENTOS_COMPARACION, 
  obtenerElementosApropiados,
  CategoriaComparacion 
} from '../types/comparacion';
import { Incendio } from '../types/incendios';
import { calcularSuperficie, metrosAHectareas } from './helpers/superficie';

// Resultado de comparación con información adicional
export interface ResultadoComparacion {
  elemento: ElementoComparacion;
  factor: number; // Cuántas veces cabe el elemento en el incendio (o viceversa)
  relacion: 'mayor' | 'menor' | 'similar';
  descripcionComparacion: string;
}

// Servicio para manejar comparaciones de superficies
export class ComparacionService {
  
  /**
   * Calcula la superficie de un incendio basado en su área
   */
  static calcularSuperficieIncendio(incendio: Incendio): number {
    // Usar area_mts si está disponible, sino usar cálculo por puntos, sino 1 hectárea por defecto
    if (incendio.area_mts) {
      return metrosAHectareas(incendio.area_mts);
    }
    
    if (!incendio.area || !incendio.area.puntos || incendio.area.puntos.length < 3) {
      // Si no hay área definida, usar un área estimada pequeña (ej: 1 hectárea)
      return 1;
    }
    
    const superficieMetros = calcularSuperficie(incendio.area.puntos);
    return metrosAHectareas(superficieMetros);
  }

  /**
   * Genera comparaciones apropiadas para un incendio
   */
  static generarComparaciones(incendio: Incendio): ResultadoComparacion[] {
    const superficie = this.calcularSuperficieIncendio(incendio);
    const elementosApropiados = obtenerElementosApropiados(superficie);
    
    return elementosApropiados.map(elemento => {
      const factor = superficie / elemento.superficie;
      let relacion: 'mayor' | 'menor' | 'similar';
      let descripcionComparacion: string;
      
      if (factor > 1.5) {
        relacion = 'mayor';
        if (factor < 5) {
          descripcionComparacion = `Equivale a ${factor.toFixed(1)} veces ${elemento.nombre}`;
        } else if (factor < 50) {
          descripcionComparacion = `Equivale a ${Math.round(factor)} veces ${elemento.nombre}`;
        } else {
          descripcionComparacion = `Es ${Math.round(factor)} veces más grande que ${elemento.nombre}`;
        }
      } else if (factor < 0.7) {
        relacion = 'menor';
        const factorInverso = elemento.superficie / superficie;
        if (factorInverso < 5) {
          descripcionComparacion = `${factorInverso.toFixed(1)} veces este incendio cabrían en ${elemento.nombre}`;
        } else {
          descripcionComparacion = `Es ${Math.round(factorInverso)} veces más pequeño que ${elemento.nombre}`;
        }
      } else {
        relacion = 'similar';
        descripcionComparacion = `Tiene un tamaño similar a ${elemento.nombre}`;
      }
      
      return {
        elemento,
        factor: factor > 1 ? factor : 1 / factor,
        relacion,
        descripcionComparacion
      };
    });
  }

  /**
   * Obtiene elementos por categoría
   */
  static obtenerElementosPorCategoria(categoria: CategoriaComparacion): ElementoComparacion[] {
    return ELEMENTOS_COMPARACION.filter(el => el.categoria === categoria);
  }

  /**
   * Busca elementos que contengan un término
   */
  static buscarElementos(termino: string): ElementoComparacion[] {
    const terminoLower = termino.toLowerCase();
    return ELEMENTOS_COMPARACION.filter(el => 
      el.nombre.toLowerCase().includes(terminoLower) ||
      el.descripcion.toLowerCase().includes(terminoLower) ||
      el.pais?.toLowerCase().includes(terminoLower) ||
      el.ciudad?.toLowerCase().includes(terminoLower)
    );
  }

  /**
   * Obtiene comparación específica entre un incendio y un elemento
   */
  static compararConElemento(incendio: Incendio, elementoId: string): ResultadoComparacion | null {
    const superficie = this.calcularSuperficieIncendio(incendio);
    const elemento = ELEMENTOS_COMPARACION.find(el => el.id === elementoId);
    
    if (!elemento) return null;
    
    const comparaciones = this.generarComparaciones(incendio);
    return comparaciones.find(comp => comp.elemento.id === elementoId) || null;
  }

  /**
   * Obtiene un resumen estadístico de comparaciones
   */
  static obtenerResumenComparaciones(incendios: Incendio[]): {
    superficie_total: number;
    comparaciones_destacadas: ResultadoComparacion[];
    incendio_mayor: { incendio: Incendio; superficie: number };
    incendio_menor: { incendio: Incendio; superficie: number };
  } {
    if (incendios.length === 0) {
      return {
        superficie_total: 0,
        comparaciones_destacadas: [],
        incendio_mayor: { incendio: {} as Incendio, superficie: 0 },
        incendio_menor: { incendio: {} as Incendio, superficie: 0 }
      };
    }
    
    // Calcular superficie total usando area_mts y convertir a hectáreas
    const superficie_total = incendios.reduce((total, incendio) => {
      
      const areaMts = incendio.area_mts || 0;
      
      return total + metrosAHectareas(areaMts);
    }, 0);

    // Encontrar el incendio más grande y más pequeño
    const primerIncendio = incendios[0];
    const primerSuperficie = metrosAHectareas(primerIncendio.area_mts || 0);
    let incendio_mayor = { incendio: primerIncendio, superficie: primerSuperficie };
    let incendio_menor = { incendio: primerIncendio, superficie: primerSuperficie };

    incendios.forEach(incendio => {
      const areaMts = incendio.area_mts || 0;
      const superficie = metrosAHectareas(areaMts);
      if (superficie > incendio_mayor.superficie) {
        incendio_mayor = { incendio, superficie };
      }
      if (superficie < incendio_menor.superficie) {
        incendio_menor = { incendio, superficie };
      }
    });

    // Generar comparaciones para la superficie total
    const incendioTotalFicticio: Incendio = {
      id: 'total',
      lugar: { coordenadas: { lat: 0, lng: 0 } },
      area: {
        puntos: this.generarPoligonoFicticio(superficie_total),
        descripcion: 'Área total de todos los incendios'
      },
      area_mts: superficie_total * 10000, // Convertir hectáreas a metros cuadrados
      estado: 'activo' as any,
      fecha_de_registro: new Date()
    };

    const comparaciones_destacadas = this.generarComparaciones(incendioTotalFicticio)
      .slice(0, 4); // Top 4 comparaciones

    return {
      superficie_total,
      comparaciones_destacadas,
      incendio_mayor,
      incendio_menor
    };
  }

  /**
   * Genera un polígono ficticio para representar una superficie dada
   * (usado para comparaciones de superficie total)
   */
  private static generarPoligonoFicticio(superficie: number): { lat: number; lng: number }[] {
    // Crear un cuadrado que tenga la superficie especificada
    const lado = Math.sqrt(superficie * 10000); // Convertir hectáreas a metros cuadrados y calcular lado
    const ladoEnGrados = lado / 111320; // Aproximación: 1 grado ≈ 111320 metros
    
    return [
      { lat: -34.6, lng: -58.4 },
      { lat: -34.6, lng: -58.4 + ladoEnGrados },
      { lat: -34.6 + ladoEnGrados, lng: -58.4 + ladoEnGrados },
      { lat: -34.6 + ladoEnGrados, lng: -58.4 }
    ];
  }

  /**
   * Formatea el factor de comparación para mostrar
   */
  static formatearFactor(factor: number): string {
    if (factor < 1) {
      return `1/${Math.round(1/factor)}`;
    } else if (factor < 10) {
      return factor.toFixed(1);
    } else {
      return Math.round(factor).toString();
    }
  }

  /**
   * Obtiene el color apropiado según la relación de tamaño
   */
  static obtenerColorRelacion(relacion: 'mayor' | 'menor' | 'similar'): string {
    switch (relacion) {
      case 'mayor':
        return 'text-red-600'; // Rojo para incendios más grandes
      case 'menor':
        return 'text-green-600'; // Verde para incendios más pequeños
      case 'similar':
        return 'text-orange-600'; // Naranja para tamaños similares
      default:
        return 'text-gray-600';
    }
  }
}