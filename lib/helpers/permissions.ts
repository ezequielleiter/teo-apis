import { UserRole } from '../../types/auth';

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
export function validateUserPermissions(
  sessionOrUser: SessionLike, 
  resourceUserId?: string
): boolean {
  const user = extractUser(sessionOrUser);
  
  // Si no hay usuario, no hay permisos
  if (!user) {
    return false;
  }

  // Si es superadmin, tiene permisos para todo
  if (user.role === UserRole.SUPERADMIN) {
    return true;
  }

  // Si es admin, solo puede editar sus propios recursos
  if (user.role === UserRole.ADMIN && resourceUserId) {
    return user.id === resourceUserId;
  }

  return false;
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
    return { ...baseQuery, user_id: user.id };
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