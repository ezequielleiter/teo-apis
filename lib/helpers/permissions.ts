import { UserRole } from '../../types/auth';
import { obtenerBuffetsPorCliente } from '../buffets';

// Tipo flexible para sesión que acepta tanto Session completa como parcial, o directamente un usuario
type SessionLike = {
  user: {
    id: string;
    role: string;
  };
} | {
  id: string;
  role: string;
} | null;

// Helper para extraer el usuario de una sesión o usuario directo
function extractUser(sessionOrUser: SessionLike): { id: string; role: string } | null {
  if (!sessionOrUser) return null;
  
  // Si tiene propiedad 'user', es una sesión
  if ('user' in sessionOrUser && sessionOrUser.user) {
    return sessionOrUser.user;
  }
  
  // Si tiene 'id' y 'role' directamente, es un usuario
  if ('id' in sessionOrUser && 'role' in sessionOrUser) {
    return sessionOrUser;
  }
  
  return null;
}

/**
 * Valida si un usuario tiene permisos para acceder o editar un recurso
 * @param sessionOrUser - Sesión o usuario actual
 * @param resourceUserId - ID del usuario propietario del recurso
 * @returns boolean indicando si tiene permisos
 */
export async function validateUserPermissions(
    buffet_id: string | undefined, 
    session: { user: { id: string; role: string; buffet_id?: string } },
  ): Promise<void> {
    const {buffets} = await obtenerBuffetsPorCliente({}, session)
    const buffet = buffets[0]
    if (!buffet_id) {
      throw new Error('ID de buffet requerido para validar permisos (buffet_id faltante en la promo)');
    }

    // Verificar si el usuario es superadmin
    if (session.user?.role === 'superadmin') {
      return; // Superadmin tiene acceso a todo
    }

    // Verificar si el usuario es admin del buffet específico
    if (session.user?.role === 'admin') {
      if (!buffet?._id) {
        throw new Error('No se encontró buffet asociado al usuario administrador para validar permisos');
      }
      if (buffet._id.toString() === buffet_id) {
        return; // Admin del buffet tiene acceso
      } else {
        throw new Error('El usuario administrador no tiene acceso a este buffet (mismatch de buffet_id)');
      }
    }

    throw new Error('No tienes permisos para realizar esta acción en este buffet');
  }

/**
 * Valida si un usuario puede crear un nuevo recurso
 * @param sessionOrUser - Sesión o usuario actual
 * @returns boolean indicando si puede crear
 */
export function validateCreatePermissions(sessionOrUser: SessionLike): boolean {
  const user = extractUser(sessionOrUser);
  
  if (!user) {
    return false;
  }

  return ['admin', 'superadmin'].includes(user.role);
}

/**
 * Agrega filtros de usuario a una consulta según los permisos
 * @param sessionOrUser - Sesión o usuario actual
 * @param baseQuery - Query base sin filtros de usuario
 * @returns Query con filtros de usuario aplicados
 */
export function addUserFilters(
  sessionOrUser: SessionLike,
  baseQuery: Record<string, unknown> = {}
): Record<string, unknown> {
  const user = extractUser(sessionOrUser);
  
  if (!user) {
    // Si no hay usuario, retornar query que no devolverá nada
    return { ...baseQuery, user_id: 'unauthorized' };
  }

  // Si es superadmin, puede ver todo
  if (user.role === UserRole.SUPERADMIN) {
    return baseQuery;
  }

  // Si es admin, solo puede ver sus propios recursos
  if (user.role === UserRole.ADMIN) {
    return { ...baseQuery, user_id: user.id.toString() };
  }

  // Por defecto, no mostrar nada
  return { ...baseQuery, user_id: 'unauthorized' };
}

/**
 * Valida si un usuario puede editar/eliminar un recurso específico por su ID de propietario
 * @param sessionOrUser - Sesión o usuario actual
 * @param resourceUserId - ID del usuario propietario del recurso
 * @param resourceType - Tipo de recurso para mensajes de error más específicos
 * @returns Objeto con resultado de validación y mensaje de error si aplica
 */
export function validateResourceOwnership(
  sessionOrUser: SessionLike,
  resourceUserId: string | undefined,
  resourceType: string = 'recurso'
): { allowed: boolean; error?: string } {
  const user = extractUser(sessionOrUser);
  
  if (!user) {
    return {
      allowed: false,
      error: 'No autenticado'
    };
  }

  if (!resourceUserId) {
    return {
      allowed: false,
      error: `${resourceType} no encontrado o sin propietario definido`
    };
  }

  // Si es superadmin, siempre puede editar
  if (user.role === UserRole.SUPERADMIN) {
    return { allowed: true };
  }

  // Si es admin, solo puede editar sus propios recursos
  if (user.role === UserRole.ADMIN) {
    if (user.id === resourceUserId) {
      return { allowed: true };
    }
    return {
      allowed: false,
      error: `No tienes permisos para modificar este ${resourceType}`
    };
  }

  return {
    allowed: false,
    error: 'Permisos insuficientes'
  };
}