import { Coordenadas } from '../../types/incendios';

/**
 * Calcula el área de un polígono definido por coordenadas geográficas
 * Utiliza la fórmula de Shoelace para coordenadas proyectadas en metros
 * @param puntos Array de coordenadas que forman el polígono
 * @returns Área en metros cuadrados
 */
export function calcularAreaPoligono(puntos: Coordenadas[]): number {
  if (puntos.length < 3) {
    return 0;
  }

  // Asegurar que el polígono esté cerrado
  const puntosCompletos = [...puntos];
  if (
    puntosCompletos[0].lat !== puntosCompletos[puntosCompletos.length - 1].lat ||
    puntosCompletos[0].lng !== puntosCompletos[puntosCompletos.length - 1].lng
  ) {
    puntosCompletos.push(puntosCompletos[0]);
  }

  // Convertir coordenadas geográficas a proyección aproximada en metros
  // Usar el punto central para la proyección
  const latCentral = puntos.reduce((sum, p) => sum + p.lat, 0) / puntos.length;
  const lngCentral = puntos.reduce((sum, p) => sum + p.lng, 0) / puntos.length;

  // Factores de conversión aproximados para la proyección
  const metrosPorGradoLat = 111000; // Aproximadamente 111 km por grado de latitud
  const metrosPorGradoLng = 111000 * Math.cos((latCentral * Math.PI) / 180); // Ajustado por latitud

  // Convertir puntos a coordenadas proyectadas en metros
  const puntosProyectados = puntosCompletos.map(punto => ({
    x: (punto.lng - lngCentral) * metrosPorGradoLng,
    y: (punto.lat - latCentral) * metrosPorGradoLat
  }));

  // Aplicar fórmula de Shoelace
  let area = 0;
  for (let i = 0; i < puntosProyectados.length - 1; i++) {
    const p1 = puntosProyectados[i];
    const p2 = puntosProyectados[i + 1];
    area += p1.x * p2.y - p2.x * p1.y;
  }

  // Retornar área absoluta dividida por 2
  return Math.abs(area) / 2;
}

/**
 * Calcula el área aproximada usando la fórmula de Haversine para mayor precisión
 * @param puntos Array de coordenadas que forman el polígono
 * @returns Área en metros cuadrados
 */
export function calcularAreaPoligonoHaversine(puntos: Coordenadas[]): number {
  if (puntos.length < 3) {
    return 0;
  }

  const EARTH_RADIUS = 6371000; // Radio de la Tierra en metros
  
  // Asegurar que el polígono esté cerrado
  const puntosCompletos = [...puntos];
  if (
    puntosCompletos[0].lat !== puntosCompletos[puntosCompletos.length - 1].lat ||
    puntosCompletos[0].lng !== puntosCompletos[puntosCompletos.length - 1].lng
  ) {
    puntosCompletos.push(puntosCompletos[0]);
  }

  // Convertir grados a radianes
  const puntosRad = puntosCompletos.map(punto => ({
    lat: (punto.lat * Math.PI) / 180,
    lng: (punto.lng * Math.PI) / 180
  }));

  let area = 0;
  
  for (let i = 0; i < puntosRad.length - 1; i++) {
    const p1 = puntosRad[i];
    const p2 = puntosRad[i + 1];
    
    // Fórmula para el área de un segmento esférico
    area += (p2.lng - p1.lng) * (2 + Math.sin(p1.lat) + Math.sin(p2.lat));
  }

  // Convertir a metros cuadrados
  area = Math.abs(area) * EARTH_RADIUS * EARTH_RADIUS / 2;
  
  return area;
}