import { Coordenadas } from '../../types/incendios';

/**
 * Calcula la superficie de un polígono definido por coordenadas geográficas
 * @param coordenadas Array de coordenadas que definen el polígono
 * @returns Superficie en metros cuadrados
 */
export const calcularSuperficie = (coordenadas: Coordenadas[]): number => {
  if (coordenadas.length < 3) return 0;

  // Algoritmo de Shoelace para calcular el área de un polígono
  let area = 0;
  const n = coordenadas.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordenadas[i].lat * coordenadas[j].lng;
    area -= coordenadas[j].lat * coordenadas[i].lng;
  }

  area = Math.abs(area) / 2;
  
  // Convertir de grados cuadrados a metros cuadrados aproximados
  // Esta conversión usa una aproximación basada en la proyección terrestre
  const metrosCuadrados = area * 111000 * 111000 * Math.cos((coordenadas[0].lat * Math.PI) / 180);
  
  return Math.round(metrosCuadrados);
};

/**
 * Formatea la superficie en una cadena legible
 * @param metros Superficie en metros cuadrados
 * @returns Cadena formateada (m² para áreas < 1 hectárea, ha para áreas >= 1 hectárea)
 */
export const formatearSuperficie = (metros: number): string => {
  if (metros < 10000) {
    return `${metros.toLocaleString('es-AR')} m²`;
  } else { 
    const hectareas = metros / 10000;
    return `${hectareas.toFixed(2)} ha`;
  }
};

/**
 * Convierte metros cuadrados a hectáreas
 * @param metrosCuadrados Superficie en metros cuadrados
 * @returns Superficie en hectáreas
 */
export const metrosAHectareas = (metrosCuadrados: number): number => {
  return metrosCuadrados / 10000;
};

/**
 * Convierte hectáreas a metros cuadrados
 * @param hectareas Superficie en hectáreas
 * @returns Superficie en metros cuadrados
 */
export const hectareasAMetros = (hectareas: number): number => {
  return hectareas * 10000;
};