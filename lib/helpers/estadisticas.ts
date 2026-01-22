import { IncendioService } from "../incendios";
import { calcularSuperficie, metrosAHectareas } from "./superficie";

export async function getIncendiosStats() {
  try {
    const incendios = await IncendioService.obtenerIncendios();
    const incendiosActivos = incendios.filter(i => i.estado === 'activo');
    
    let superficieTotalQuemada = 0;
    let superficieActiva = 0;
    
    incendios.forEach(incendio => {
      if (incendio.area?.puntos && incendio.area.puntos.length >= 3) {
        const superficie = calcularSuperficie(incendio.area.puntos);
        superficieTotalQuemada += superficie;
        
        if (incendio.estado === 'activo') {
          superficieActiva += superficie;
        }
      }
    });

    // Calcular días transcurridos del año 2026
    const inicioAnio = new Date('2026-01-01');
    const ahora = new Date();
    const diasTranscurridos = Math.floor((ahora.getTime() - inicioAnio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const superficiePorDia = diasTranscurridos > 0 ? superficieTotalQuemada / diasTranscurridos : 0;
    const superficiePorDiaHectareas = metrosAHectareas(superficiePorDia);
    
    return {
      totalIncendios: incendios.length,
      incendiosActivos: incendiosActivos.length,
      superficieTotalQuemada,
      superficieActiva,
      superficieTotalHectareas: metrosAHectareas(superficieTotalQuemada),
      superficieActivaHectareas: metrosAHectareas(superficieActiva),
      diasTranscurridos,
      superficiePorDia,
      superficiePorDiaHectareas
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de incendios:', error);
    return {
      totalIncendios: 0,
      incendiosActivos: 0,
      superficieTotalQuemada: 0,
      superficieActiva: 0,
      superficieTotalHectareas: 0,
      superficieActivaHectareas: 0,
      diasTranscurridos: 0,
      superficiePorDia: 0,
      superficiePorDiaHectareas: 0
    };
  }
}