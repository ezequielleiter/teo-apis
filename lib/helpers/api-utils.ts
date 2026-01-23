import { AvailableAPI } from '@/types/auth';

/**
 * Obtiene la lista de APIs disponibles con sus descripciones
 * Esta función no requiere acceso a la base de datos y puede usarse en el cliente
 */
export function getAvailableAPIs(): { value: AvailableAPI; label: string; description: string }[] {
  return [
    {
      value: AvailableAPI.ADMIN_BUFFETS,
      label: 'Admin Buffets',
      description: 'Gestión de buffets, eventos, órdenes y productos'
    },
    {
      value: AvailableAPI.INCENDIOS,
      label: 'Incendios',
      description: 'Gestión de alertas y datos de incendios'
    },
    {
      value: AvailableAPI.PUNTOS_DONACION,
      label: 'Puntos de Donación',
      description: 'Gestión de puntos de donación y aprobaciones'
    },
    {
      value: AvailableAPI.REGISTRAR_CENTRO,
      label: 'Registrar Centro',
      description: 'Registro de nuevos centros'
    }
  ];
}