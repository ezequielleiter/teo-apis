import { z } from 'zod';

// User roles
export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin'
}

// Available APIs
export enum AvailableAPI {
  ADMIN_BUFFETS = 'admin-buffets',
  INCENDIOS = 'incendios',
  PUNTOS_DONACION = 'puntos-donacion',
  REGISTRAR_CENTRO = 'registrar-centro'
}

// User type definitions
export interface User {
  _id?: string;
  email: string;
  password: string;
  role: UserRole;
  apis?: number; // Number of APIs the user can access (legacy field for superadmin)
  api_access?: AvailableAPI[]; // Specific APIs the user can access (for admin users)
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string; // ID of user who created this user
}

// Validation schemas
export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirma la nueva contraseña'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const createUserSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.nativeEnum(UserRole, {
    message: 'Rol debe ser superadmin o admin'
  }),
  apis: z.number().int().min(1, 'Debe especificar al menos 1 API').optional(), // Para superadmin
  api_access: z.array(z.nativeEnum(AvailableAPI)).optional() // Para admin
}).refine(data => {
  // Si es admin, debe tener api_access
  if (data.role === UserRole.ADMIN && (!data.api_access || data.api_access.length === 0)) {
    return false;
  }
  // Si es superadmin, no debería tener api_access (tiene acceso total)
  if (data.role === UserRole.SUPERADMIN && data.api_access) {
    return false;
  }
  return true;
}, {
  message: 'Los usuarios admin deben tener al menos una API asignada. Los superadmin no necesitan APIs específicas.',
  path: ['api_access'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;