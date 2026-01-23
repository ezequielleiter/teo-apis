# Sistema de Permisos de APIs para Usuarios Admin

Este sistema permite asignar permisos específicos de API a usuarios con rol `admin`, proporcionando un control granular sobre qué endpoints pueden acceder.

## 🎯 Características

- **Control granular**: Los usuarios admin pueden tener acceso solo a APIs específicas
- **Superadmin mantiene acceso total**: Los superadmin siguen teniendo acceso completo
- **Validación automática**: Middleware automático verifica permisos en cada request
- **Fácil mantenimiento**: Sistema centralizado de gestión de permisos

## 📋 APIs Disponibles

| API | Enum Value | Descripción |
|-----|------------|-------------|
| Admin Buffets | `ADMIN_BUFFETS` | Gestión de buffets, eventos, órdenes y productos |
| Incendios | `INCENDIOS` | Gestión de alertas y datos de incendios |
| Puntos de Donación | `PUNTOS_DONACION` | Gestión de puntos de donación y aprobaciones |
| Registrar Centro | `REGISTRAR_CENTRO` | Registro de nuevos centros |

## 🔧 Estructura de Usuario

### Usuario Admin
```typescript
{
  email: "admin@ejemplo.com",
  password: "password123",
  role: UserRole.ADMIN,
  api_access: [AvailableAPI.INCENDIOS, AvailableAPI.PUNTOS_DONACION]
}
```

### Usuario SuperAdmin
```typescript
{
  email: "superadmin@ejemplo.com", 
  password: "password123",
  role: UserRole.SUPERADMIN
  // No necesita api_access - tiene acceso total
}
```

## 🚀 Uso

### Crear Usuario Admin con Permisos Específicos

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <superadmin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin.incendios@ejemplo.com",
    "password": "password123", 
    "role": "admin",
    "api_access": ["incendios"]
  }'
```

### Verificar Permisos en Endpoints

Los endpoints protegidos automáticamente verifican permisos:

```typescript
// En cualquier endpoint protegido
import { withAPIAccess } from '@/lib/helpers/auth-helpers';
import { AvailableAPI } from '@/types/auth';

export async function POST(request: NextRequest) {
  // Verificar permisos automáticamente
  const accessCheck = await withAPIAccess(AvailableAPI.INCENDIOS);
  if (accessCheck.error) {
    return NextResponse.json(
      { error: accessCheck.error },
      { status: accessCheck.status }
    );
  }

  // Usuario tiene permisos, continuar...
  const currentUser = accessCheck.user;
}
```

## 🛡️ Respuestas de Error

### 401 - No Autenticado
```json
{
  "error": "No autorizado"
}
```

### 403 - Sin Permisos
```json
{
  "error": "No tienes permisos para acceder a la API: incendios"
}
```

### 400 - Datos Inválidos (creación de usuario)
```json
{
  "error": "Los usuarios admin deben tener al menos una API asignada. Los superadmin no necesitan APIs específicas."
}
```

## 🔍 Validaciones

### Validaciones de Creación de Usuario
- ✅ Usuarios admin **deben** tener al menos una API en `api_access`
- ✅ Usuarios superadmin **no deben** tener `api_access` (acceso total automático)
- ✅ Solo superadmin pueden crear otros usuarios
- ✅ Solo superadmin pueden crear otros superadmin

### Validaciones de Acceso
- ✅ Usuarios deben estar autenticados
- ✅ Usuarios admin solo pueden acceder a sus APIs asignadas
- ✅ Superadmin tienen acceso total automático
- ✅ Permisos especiales (ej: eliminar) pueden tener restricciones adicionales

## 📂 Archivos Importantes

### Tipos y Schemas
- `types/auth.ts` - Definiciones de tipos, enums y schemas de validación
- `lib/helpers/auth-helpers.ts` - Funciones helper para verificación de permisos

### Servicios
- `lib/auth.ts` - UserService actualizado con soporte para api_access

### Endpoints Actualizados
- `app/api/admin/users/route.ts` - Creación de usuarios con permisos
- `app/api/incendios/route.ts` - Ejemplo de endpoint protegido
- `app/api/puntos-donacion/route.ts` - Ejemplo de endpoint protegido

## 🔄 Migración

### Para Usuarios Existentes
Los usuarios existentes sin `api_access` seguirán funcionando:
- **Superadmin**: Mantienen acceso total
- **Admin**: Necesitarán `api_access` asignado para acceder a endpoints protegidos

### Actualizar Usuario Existente
```javascript
// En MongoDB directamente o crear endpoint de actualización
db.users.updateOne(
  { email: "admin@ejemplo.com" },
  { 
    $set: { 
      api_access: ["incendios", "puntos-donacion"] 
    } 
  }
)
```

## 🧪 Testing

Ver ejemplos completos en:
- `scripts/create-users-example.ts` - Scripts y ejemplos de uso
- Ejecutar: `tsx scripts/create-users-example.ts`

## 🚨 Consideraciones de Seguridad

1. **Principio de menor privilegio**: Asignar solo las APIs necesarias
2. **Auditoría**: Registrar creación/modificación de usuarios 
3. **Rotación de tokens**: Implementar expiración de tokens de autenticación
4. **Validación constante**: Verificar permisos en cada request, no solo al login

## 📈 Futura Extensibilidad

Este sistema está diseñado para ser fácilmente extensible:

1. **Nuevas APIs**: Agregar valores al enum `AvailableAPI`
2. **Permisos granulares**: Extender a nivel de método (GET, POST, PUT, DELETE)
3. **Permisos contextuales**: Basados en recursos específicos (ej: solo incendios de su región)
4. **Roles adicionales**: Agregar roles más específicos al enum `UserRole`