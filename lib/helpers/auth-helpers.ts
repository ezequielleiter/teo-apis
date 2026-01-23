import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { UserService } from '@/lib/auth';
import { AvailableAPI, UserRole, User } from '@/types/auth';

/**
 * Verifica si el usuario actual tiene permisos para acceder a una API específica
 */
export async function checkAPIAccess(apiName: AvailableAPI): Promise<{
  hasAccess: boolean;
  user: User | null;
  error?: string;
}> {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        hasAccess: false,
        user: null,
        error: 'No autorizado'
      };
    }

    // Obtener usuario actual
    const currentUser = await UserService.findUserById(session.user.id);
    if (!currentUser) {
      return {
        hasAccess: false,
        user: null,
        error: 'Usuario no encontrado'
      };
    }

    // Los superadmin tienen acceso a todo
    if (currentUser.role === UserRole.SUPERADMIN) {
      return {
        hasAccess: true,
        user: currentUser
      };
    }

    // Para usuarios admin, verificar api_access
    if (currentUser.role === UserRole.ADMIN) {
      const hasAccess = currentUser.api_access?.includes(apiName) || false;
      return {
        hasAccess,
        user: currentUser,
        error: hasAccess ? undefined : `No tienes permisos para acceder a la API: ${apiName}`
      };
    }

    return {
      hasAccess: false,
      user: currentUser,
      error: 'Rol de usuario no reconocido'
    };
  } catch (error) {
    console.error('Error checking API access:', error);
    return {
      hasAccess: false,
      user: null,
      error: 'Error interno del servidor'
    };
  }
}

/**
 * Middleware helper para verificar acceso a API antes de procesar la request
 */
export async function withAPIAccess(apiName: AvailableAPI) {
  const accessCheck = await checkAPIAccess(apiName);
  
  if (!accessCheck.hasAccess) {
    return {
      error: accessCheck.error || 'Acceso denegado',
      status: accessCheck.user ? 403 : 401,
      user: null
    };
  }

  return {
    error: null,
    status: 200,
    user: accessCheck.user
  };
}