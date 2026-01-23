import { Session } from 'next-auth';
import { UserRole } from '../../types/auth';

// Tipo flexible para sesión que acepta tanto Session completa como parcial
type SessionLike = {
  user: {
    id: string;
    role: string;
  };
} | null;

/**
 * Valida si un usuario tiene permisos para acceder o editar un recurso
 * @param session - Sesión del usuario actual
 * @param resourceUserId - ID del usuario propietario del recurso
 * @returns boolean indicando si tiene permisos
 */
export function validateUserPermissions(
  session: SessionLike, 
  resourceUserId?: string
): boolean {
  // Si no hay sesión o usuario, no hay permisos
  if (!session?.user) {
    return false;
  }

  // Si es superadmin, tiene permisos para todo
  if (session.user.role === UserRole.SUPERADMIN) {
    return true;
  }

  // Si es admin, solo puede editar sus propios recursos
  if (session.user.role === UserRole.ADMIN && resourceUserId) {
    return session.user.id === resourceUserId;
  }

  return false;
}

/**
 * Valida si un usuario puede crear un nuevo recurso
 * @param session - Sesión del usuario actual
 * @returns boolean indicando si puede crear
 */
export function validateCreatePermissions(session: SessionLike): boolean {
  if (!session?.user) {
    return false;
  }

  return ['admin', 'superadmin'].includes(session.user.role);
}

/**
 * Agrega filtros de usuario a una consulta según los permisos
 * @param session - Sesión del usuario actual
 * @param baseQuery - Query base sin filtros de usuario
 * @returns Query con filtros de usuario aplicados
 */
export function addUserFilters(
  session: SessionLike,
  baseQuery: Record<string, unknown> = {}
): Record<string, unknown> {
  if (!session?.user) {
    // Si no hay sesión, retornar query que no devolverá nada
    return { ...baseQuery, user_id: 'unauthorized' };
  }

  // Si es superadmin, puede ver todo
  if (session.user.role === UserRole.SUPERADMIN) {
    return baseQuery;
  }

  // Si es admin, solo puede ver sus propios recursos
  if (session.user.role === UserRole.ADMIN) {
    return { ...baseQuery, user_id: session.user.id };
  }

  // Por defecto, no mostrar nada
  return { ...baseQuery, user_id: 'unauthorized' };
}

/**
 * Valida si un usuario puede editar/eliminar un recurso específico por su ID de propietario
 * @param session - Sesión del usuario actual
 * @param resourceUserId - ID del usuario propietario del recurso
 * @param resourceType - Tipo de recurso para mensajes de error más específicos
 * @returns Objeto con resultado de validación y mensaje de error si aplica
 */
export function validateResourceOwnership(
  session: Session | null,
  resourceUserId: string | undefined,
  resourceType: string = 'recurso'
): { allowed: boolean; error?: string } {
  if (!session?.user) {
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
  if (session.user.role === UserRole.SUPERADMIN) {
    return { allowed: true };
  }

  // Si es admin, solo puede editar sus propios recursos
  if (session.user.role === UserRole.ADMIN) {
    if (session.user.id === resourceUserId) {
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