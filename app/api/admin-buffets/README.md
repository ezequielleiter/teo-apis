# API Admin Buffets

Esta API proporciona un sistema completo de gestión de buffets, eventos, productos, promociones y órdenes. Está diseñada para administradores que necesitan gestionar operaciones de múltiples buffets.

## Tabla de Contenidos

- [Autenticación y Autorización](#autenticación-y-autorización)
- [Endpoints](#endpoints)
- [Entidades y Relaciones](#entidades-y-relaciones)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Funcionalidades Especiales](#funcionalidades-especiales)

## Autenticación y Autorización

Todos los endpoints requieren:
- **Autenticación**: Usuario autenticado con NextAuth
- **Autorización**: Rol de `admin` o `superadmin`

Los requests deben incluir las cookies de sesión válidas.

### Sistema de Permisos

#### SuperAdmin
- **Acceso total**: Puede ver, crear, editar y eliminar todos los recursos de todos los usuarios
- **Sin restricciones**: No se aplican filtros de `user_id`

#### Admin
- **Acceso restringido**: Solo puede ver y gestionar sus propios recursos
- **Filtros automáticos**: Todos los recursos se filtran por `user_id = session.user.id`
- **Aislamiento de datos**: No puede acceder a recursos de otros administradores

#### Asignación Automática
Cuando un usuario `admin` crea cualquier recurso, se asigna automáticamente:
```json
{
  "user_id": "session.user.id"
}
```

## Endpoints

### 1. Buffets (`/api/admin-buffets/buffets`)

#### POST - Crear Buffet
```http
POST /api/admin-buffets/buffets
Content-Type: application/json

{
  "nombre": "Buffet Central",
  "lugar": "Av. Principal 123, Ciudad",
  "descripcion": "Buffet especializado en comida internacional"
}
```

#### GET - Listar Buffets
```http
GET /api/admin-buffets/buffets?nombre=Central&lugar=Ciudad&user_id=65f1234567890abcdef12345&limite=10&pagina=1
```

**Parámetros de consulta:**
- `nombre` (string): Búsqueda por nombre (case-insensitive)
- `lugar` (string): Búsqueda por lugar (case-insensitive)
- `user_id` (string): Filtrar por usuario propietario (solo superadmin)
- `limite` (number): Elementos por página (1-100, default: 20)
- `pagina` (number): Número de página (default: 1)

**Nota**: Los usuarios `admin` solo verán sus propios buffets automáticamente.

### 2. Eventos (`/api/admin-buffets/eventos`)

#### POST - Crear Evento
```http
POST /api/admin-buffets/eventos
Content-Type: application/json

{
  "fecha": "2026-02-15T19:00:00.000Z",
  "buffet_id": "65f1234567890abcdef12345"
}
```

#### GET - Listar Eventos
```http
GET /api/admin-buffets/eventos?buffet_id=65f1234567890abcdef12345&user_id=65f1234567890abcdef12345&fecha_desde=2026-02-01T00:00:00.000Z&fecha_hasta=2026-02-28T23:59:59.999Z
```

**Parámetros de consulta:**
- `buffet_id` (string): Filtrar por buffet específico
- `user_id` (string): Filtrar por usuario propietario (solo superadmin)
- `fecha_desde` (ISO string): Fecha de inicio del rango
- `fecha_hasta` (ISO string): Fecha de fin del rango
- `limite` (number): Elementos por página (default: 20)
- `pagina` (number): Número de página (default: 1)

### 3. Productos (`/api/admin-buffets/productos`)

#### POST - Crear Producto
```http
POST /api/admin-buffets/productos
Content-Type: application/json

{
  "buffet_id": "65f1234567890abcdef12345",
  "nombre": "Parrillada Completa",
  "valor": 25.99,
  "descripcion": "Parrillada para 2 personas con carnes mixtas"
}
```

#### GET - Listar Productos
```http
GET /api/admin-buffets/productos?buffet_id=65f1234567890abcdef12345&user_id=65f1234567890abcdef12345&nombre=Parrillada&valor_min=20&valor_max=50
```

**Parámetros de consulta:**
- `buffet_id` (string): Filtrar por buffet específico
- `user_id` (string): Filtrar por usuario propietario (solo superadmin)
- `nombre` (string): Búsqueda por nombre (case-insensitive)
- `valor_min` (number): Precio mínimo
- `valor_max` (number): Precio máximo
- `limite` (number): Elementos por página (default: 20)
- `pagina` (number): Número de página (default: 1)

### 4. Promos (`/api/admin-buffets/promos`)

#### POST - Crear Promo
```http
POST /api/admin-buffets/promos
Content-Type: application/json

{
  "buffet_id": "65f1234567890abcdef12345",
  "nombre": "Combo Familiar",
  "productos": [
    "65f1234567890abcdef12346",
    "65f1234567890abcdef12347",
    "65f1234567890abcdef12348"
  ],
  "valor": 45.99
}
```

#### GET - Listar Promos
```http
GET /api/admin-buffets/promos?buffet_id=65f1234567890abcdef12345&user_id=65f1234567890abcdef12345&nombre=Combo&valor_min=40&valor_max=60
```

**Parámetros de consulta:**
- `buffet_id` (string): Filtrar por buffet específico
- `user_id` (string): Filtrar por usuario propietario (solo superadmin)
- `nombre` (string): Búsqueda por nombre (case-insensitive)
- `valor_min` (number): Precio mínimo
- `valor_max` (number): Precio máximo
- `limite` (number): Elementos por página (default: 20)
- `pagina` (number): Número de página (default: 1)

### 5. Órdenes (`/api/admin-buffets/ordenes`)

#### POST - Crear Orden
```http
POST /api/admin-buffets/ordenes
Content-Type: application/json

{
  "buffet_id": "65f1234567890abcdef12345",
  "evento_id": "65f1234567890abcdef12349",
  "productos": [
    {
      "tipo": "producto",
      "id": "65f1234567890abcdef12346",
      "cantidad": 2,
      "precio_unitario": 25.99
    },
    {
      "tipo": "promo",
      "id": "65f1234567890abcdef12350",
      "cantidad": 1,
      "precio_unitario": 45.99
    }
  ],
  "total": 97.97,
  "forma_pago": "efectivo",
  "nota": "Sin cebolla en la parrillada",
  "estado": "pendiente"
}
```

#### GET - Listar Órdenes
```http
GET /api/admin-buffets/ordenes?buffet_id=65f1234567890abcdef12345&user_id=65f1234567890abcdef12345&estado=pendiente&forma_pago=efectivo&nota=sin
```

**Parámetros de consulta:**
- `buffet_id` (string): Filtrar por buffet específico
- `evento_id` (string): Filtrar por evento específico
- `user_id` (string): Filtrar por usuario propietario (solo superadmin)
- `estado` (enum): `pendiente`, `entregado`, `cancelado`
- `forma_pago` (enum): `efectivo`, `transferencia`
- `nota` (string): Búsqueda en notas (case-insensitive)
- `fecha_desde` (ISO string): Fecha de inicio del rango
- `fecha_hasta` (ISO string): Fecha de fin del rango
- `total_min` (number): Total mínimo
- `total_max` (number): Total máximo
- `limite` (number): Elementos por página (default: 20)
- `pagina` (number): Número de página (default: 1)

## Entidades y Relaciones

### Estructura de Datos

```
Buffet (1) -----> (N) Eventos
  |
  ├── (N) Productos
  ├── (N) Promos -----> (N) Productos
  └── (N) Órdenes -----> (1) Evento
                  └----> (N) [Productos + Promos]
```

### Esquemas de Datos

#### Buffet
```typescript
{
  _id?: string;
  nombre: string;
  lugar: string;
  descripcion: string;
  user_id: string; // ID del usuario propietario
  fechaCreacion: Date;
  fechaActualizacion: Date;
}
```

#### Evento
```typescript
{
  _id?: string;
  fecha: Date;
  buffet_id: string;
  user_id: string; // ID del usuario propietario
  fechaCreacion: Date;
  fechaActualizacion: Date;
}
```

#### Producto
```typescript
{
  _id?: string;
  buffet_id: string;
  user_id: string; // ID del usuario propietario
  nombre: string;
  valor: number;
  descripcion: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}
```

#### Promo
```typescript
{
  _id?: string;
  buffet_id: string;
  user_id: string; // ID del usuario propietario
  nombre: string;
  productos: string[]; // Array de product_ids
  valor: number;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}
```

#### Orden
```typescript
{
  _id?: string;
  buffet_id: string;
  evento_id: string;
  user_id: string; // ID del usuario propietario
  productos: ItemProducto[];
  productosExpandidos: ProductoExpandido[];
  total: number;
  forma_pago: 'efectivo' | 'transferencia';
  nota?: string;
  estado: 'pendiente' | 'entregado' | 'cancelado';
  fechaCreacion: Date;
  fechaActualizacion: Date;
}
```

#### ItemProducto
```typescript
{
  tipo: 'producto' | 'promo';
  id: string;
  cantidad: number;
  precio_unitario: number;
}
```

## Ejemplos de Uso

### Flujo Completo: Crear Buffet → Evento → Productos → Promo → Orden

#### 1. Crear Buffet
```bash
curl -X POST /api/admin-buffets/buffets \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "La Parrilla Dorada",
    "lugar": "Calle Principal 456",
    "descripcion": "Especialistas en carnes a la parrilla"
  }'
```

#### 2. Crear Evento
```bash
curl -X POST /api/admin-buffets/eventos \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-03-15T20:00:00.000Z",
    "buffet_id": "BUFFET_ID_OBTENIDO"
  }'
```

#### 3. Crear Productos
```bash
curl -X POST /api/admin-buffets/productos \
  -H "Content-Type: application/json" \
  -d '{
    "buffet_id": "BUFFET_ID_OBTENIDO",
    "nombre": "Bife de Chorizo",
    "valor": 18.99,
    "descripcion": "Bife de chorizo 300g con guarnición"
  }'

curl -X POST /api/admin-buffets/productos \
  -H "Content-Type: application/json" \
  -d '{
    "buffet_id": "BUFFET_ID_OBTENIDO",
    "nombre": "Ensalada Mixta",
    "valor": 8.99,
    "descripcion": "Ensalada fresca con vegetales de estación"
  }'
```

#### 4. Crear Promo
```bash
curl -X POST /api/admin-buffets/promos \
  -H "Content-Type: application/json" \
  -d '{
    "buffet_id": "BUFFET_ID_OBTENIDO",
    "nombre": "Combo Parrilla",
    "productos": ["PRODUCTO1_ID", "PRODUCTO2_ID"],
    "valor": 24.99
  }'
```

#### 5. Crear Orden
```bash
curl -X POST /api/admin-buffets/ordenes \
  -H "Content-Type: application/json" \
  -d '{
    "buffet_id": "BUFFET_ID_OBTENIDO",
    "evento_id": "EVENTO_ID_OBTENIDO",
    "productos": [
      {
        "tipo": "promo",
        "id": "PROMO_ID_OBTENIDO",
        "cantidad": 1,
        "precio_unitario": 24.99
      }
    ],
    "total": 24.99,
    "forma_pago": "efectivo",
    "nota": "Mesa para 2 personas"
  }'
```

## Funcionalidades Especiales

### 1. Sistema de Permisos y Ownership

#### Asignación Automática de Propietario
- Cada recurso se asigna automáticamente al usuario que lo crea
- Se agrega `user_id = session.user.id` a todos los recursos nuevos
- Los usuarios `admin` no pueden especificar manualmente el `user_id`

#### Filtrado Automático por Rol
```typescript
// Para usuarios ADMIN
query = { ...baseQuery, user_id: session.user.id }

// Para usuarios SUPERADMIN  
query = baseQuery // Sin filtros adicionales
```

#### Validación de Ownership en Modificaciones
- Los usuarios `admin` solo pueden editar/eliminar sus propios recursos
- Los usuarios `superadmin` pueden modificar cualquier recurso
- Se valida ownership antes de cualquier operación de escritura

#### Integridad Referencial con Permisos
- Al crear productos/eventos/promos, se valida que el buffet pertenezca al usuario
- Al crear órdenes, se valida que buffet, evento y productos sean del mismo propietario
- Las relaciones respetan los permisos de usuario

### 2. Integridad Referencial

La API garantiza integridad referencial:
- **Eventos** solo pueden pertenecer a buffets existentes
- **Productos** solo pueden pertenecer a buffets existentes
- **Promos** solo pueden contener productos del mismo buffet
- **Órdenes** validan que buffet, evento y todos los productos/promos existan y sean consistentes

### 2. Expansión Automática de Productos

Cuando una orden incluye promos, el sistema automáticamente:
- Expande la promo en sus productos individuales
- Crea el campo `productosExpandidos` con todos los productos
- Distribuye el precio de la promo entre sus productos
- Mantiene información del origen (producto directo vs. promo)

### 3. Datos Enriquecidos

Todas las consultas retornan datos enriquecidos:
- **Eventos** incluyen información del buffet
- **Productos** incluyen información del buffet
- **Promos** incluyen información del buffet y detalles de productos
- **Órdenes** incluyen información del buffet, evento y productos expandidos

### 4. Búsqueda Avanzada

- **Búsqueda por texto**: Case-insensitive en nombres y descripciones
- **Rangos de fechas**: Para eventos y órdenes
- **Rangos de precios**: Para productos, promos y órdenes
- **Filtros múltiples**: Combinación de criterios de búsqueda

### 5. Paginación Inteligente

Todas las listas incluyen:
```typescript
{
  items: T[],
  total: number,
  pagina: number,
  totalPaginas: number
}
```

### 6. Estadísticas Automáticas

Funciones adicionales disponibles en los servicios:
- **Productos**: `obtenerEstadisticasProductos()` - precios promedio, mínimo, máximo
- **Órdenes**: `obtenerEstadisticasOrdenes()` - ventas totales, órdenes por estado

### 7. Estados de Órdenes

Sistema de gestión de estados para órdenes:
- `pendiente`: Orden recibida, en preparación
- `entregado`: Orden completada y entregada
- `cancelado`: Orden cancelada

### 8. Formas de Pago

Soporte para múltiples formas de pago:
- `efectivo`: Pago en efectivo
- `transferencia`: Pago por transferencia bancaria

### 9. Sistema de Notas

Campo opcional para agregar información adicional a las órdenes:
- Comentarios del cliente
- Instrucciones especiales
- Modificaciones del pedido
- Búsqueda por contenido de notas

## Implementación en Frontend

### 1. Configuración de Autenticación

#### Setup con NextAuth
```typescript
// lib/auth.ts
import NextAuth from 'next-auth'
import { authOptions } from './auth-options'

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
```

#### Hook de Sesión
```typescript
// hooks/useAuth.ts
import { useSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user,
    isAdmin: session?.user?.role === 'admin',
    isSuperAdmin: session?.user?.role === 'superadmin',
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading'
  }
}
```

### 2. Client HTTP con Manejo de Permisos

```typescript
// lib/api-client.ts
class ApiClient {
  private baseURL = '/api/admin-buffets'
  
  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      credentials: 'include', // Importante para cookies de sesión
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.error, response.status)
    }

    return response.json()
  }

  // Métodos específicos para cada recurso
  buffets = {
    list: (params?: BuffetFilters) => 
      this.request<PaginatedResponse<Buffet>>(`/buffets${this.buildQuery(params)}`),
    
    create: (data: CreateBuffetData) =>
      this.request<{ buffet: Buffet }>('/buffets', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      
    // ... más métodos
  }
  
  private buildQuery(params?: Record<string, any>): string {
    if (!params) return ''
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        query.append(key, value.toString())
      }
    })
    return query.toString() ? `?${query.toString()}` : ''
  }
}

export const apiClient = new ApiClient()
```

### 3. Componentes React con Permisos

#### Componente de Lista de Buffets
```tsx
// components/BuffetsList.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api-client'

interface BuffetsListProps {
  showUserFilter?: boolean // Solo para superadmin
}

export function BuffetsList({ showUserFilter }: BuffetsListProps) {
  const { isSuperAdmin } = useAuth()
  const [buffets, setBuffets] = useState<Buffet[]>([])
  const [filters, setFilters] = useState<BuffetFilters>({})
  const [pagination, setPagination] = useState({ page: 1, limit: 20 })
  
  useEffect(() => {
    loadBuffets()
  }, [filters, pagination])
  
  const loadBuffets = async () => {
    try {
      const response = await apiClient.buffets.list({
        ...filters,
        pagina: pagination.page,
        limite: pagination.limit
      })
      setBuffets(response.buffets)
    } catch (error) {
      console.error('Error loading buffets:', error)
    }
  }
  
  return (
    <div>
      {/* Filtros */}
      <div className="filters">
        <input
          type="text"
          placeholder="Buscar por nombre"
          value={filters.nombre || ''}
          onChange={(e) => setFilters(prev => ({ 
            ...prev, 
            nombre: e.target.value 
          }))}
        />
        
        {/* Solo mostrar filtro de usuario para superadmin */}
        {isSuperAdmin && showUserFilter && (
          <select
            value={filters.user_id || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              user_id: e.target.value 
            }))}
          >
            <option value="">Todos los usuarios</option>
            {/* Cargar lista de usuarios admin */}
          </select>
        )}
      </div>
      
      {/* Lista de buffets */}
      <div className="buffets-grid">
        {buffets.map(buffet => (
          <BuffetCard key={buffet._id} buffet={buffet} />
        ))}
      </div>
    </div>
  )
}
```

#### Hook Personalizado para Recursos
```tsx
// hooks/useBuffets.ts
import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { apiClient } from '@/lib/api-client'

export function useBuffets(filters: BuffetFilters = {}) {
  const { isAuthenticated } = useAuth()
  const [data, setData] = useState<{
    buffets: Buffet[]
    total: number
    loading: boolean
    error: string | null
  }>({
    buffets: [],
    total: 0,
    loading: true,
    error: null
  })
  
  const loadBuffets = async () => {
    if (!isAuthenticated) return
    
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))
      const response = await apiClient.buffets.list(filters)
      setData({
        buffets: response.buffets,
        total: response.total,
        loading: false,
        error: null
      })
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }))
    }
  }
  
  useEffect(() => {
    loadBuffets()
  }, [isAuthenticated, JSON.stringify(filters)])
  
  const createBuffet = async (buffetData: CreateBuffetData) => {
    const response = await apiClient.buffets.create(buffetData)
    await loadBuffets() // Recargar lista
    return response.buffet
  }
  
  return {
    ...data,
    createBuffet,
    reload: loadBuffets
  }
}
```

### 4. Manejo de Errores y Permisos

#### Componente de Error
```tsx
// components/ErrorBoundary.tsx
interface ApiErrorProps {
  error: ApiError
  onRetry?: () => void
}

export function ApiErrorDisplay({ error, onRetry }: ApiErrorProps) {
  const getErrorMessage = (status: number, message: string) => {
    switch (status) {
      case 401:
        return 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
      case 403:
        return 'No tienes permisos para realizar esta acción.'
      case 404:
        return 'El recurso solicitado no existe.'
      default:
        return message || 'Ha ocurrido un error inesperado.'
    }
  }
  
  return (
    <div className="error-display">
      <p>{getErrorMessage(error.status, error.message)}</p>
      {onRetry && (
        <button onClick={onRetry}>Reintentar</button>
      )}
    </div>
  )
}
```

### 5. Formularios con Validación

#### Formulario de Buffet
```tsx
// components/BuffetForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { crearBuffetSchema } from '@/types/buffets'

interface BuffetFormProps {
  onSubmit: (data: CreateBuffetData) => Promise<void>
  initialData?: Partial<CreateBuffetData>
}

export function BuffetForm({ onSubmit, initialData }: BuffetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CreateBuffetData>({
    resolver: zodResolver(crearBuffetSchema),
    defaultValues: initialData
  })
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="nombre">Nombre del Buffet</label>
        <input
          id="nombre"
          {...register('nombre')}
          className={errors.nombre ? 'error' : ''}
        />
        {errors.nombre && (
          <span className="error-text">{errors.nombre.message}</span>
        )}
      </div>
      
      <div>
        <label htmlFor="lugar">Lugar</label>
        <input
          id="lugar"
          {...register('lugar')}
          className={errors.lugar ? 'error' : ''}
        />
        {errors.lugar && (
          <span className="error-text">{errors.lugar.message}</span>
        )}
      </div>
      
      <div>
        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          {...register('descripcion')}
          className={errors.descripcion ? 'error' : ''}
        />
        {errors.descripcion && (
          <span className="error-text">{errors.descripcion.message}</span>
        )}
      </div>
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Guardar Buffet'}
      </button>
    </form>
  )
}
```

### 6. Router y Navegación

#### Protección de Rutas
```tsx
// components/ProtectedRoute.tsx
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'superadmin'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }
      
      if (requiredRole && user?.role !== requiredRole && user?.role !== 'superadmin') {
        router.push('/unauthorized')
        return
      }
    }
  }, [isAuthenticated, isLoading, user?.role, requiredRole, router])
  
  if (isLoading) {
    return <div>Cargando...</div>
  }
  
  if (!isAuthenticated) {
    return null
  }
  
  return <>{children}</>
}
```

#### Uso en Páginas
```tsx
// app/admin/buffets/page.tsx
export default function BuffetsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div>
        <h1>Gestión de Buffets</h1>
        <BuffetsList showUserFilter={true} />
      </div>
    </ProtectedRoute>
  )
}
```

### 7. Estados de Carga y UI

#### Hook de Estado Global
```tsx
// hooks/useAppState.ts
import { create } from 'zustand'

interface AppState {
  currentBuffet: Buffet | null
  setCurrentBuffet: (buffet: Buffet | null) => void
  
  notifications: Notification[]
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
}

export const useAppState = create<AppState>((set) => ({
  currentBuffet: null,
  setCurrentBuffet: (buffet) => set({ currentBuffet: buffet }),
  
  notifications: [],
  addNotification: (notification) => 
    set((state) => ({ 
      notifications: [...state.notifications, notification] 
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
}))
```

### 8. Mejores Prácticas de Implementación

#### Manejo de Permisos en UI
```tsx
// utils/permissions.tsx
import { useAuth } from '@/hooks/useAuth'

export function usePermissions() {
  const { user, isSuperAdmin } = useAuth()
  
  return {
    canViewAllUsers: isSuperAdmin,
    canEditResource: (resourceUserId: string) => 
      isSuperAdmin || user?.id === resourceUserId,
    canDeleteResource: (resourceUserId: string) =>
      isSuperAdmin || user?.id === resourceUserId,
    shouldShowUserFilter: isSuperAdmin
  }
}

// Componente de ejemplo usando permisos
export function ResourceActions({ resource }: { resource: Buffet }) {
  const { canEditResource, canDeleteResource } = usePermissions()
  
  return (
    <div className="actions">
      {canEditResource(resource.user_id) && (
        <button onClick={() => editResource(resource)}>
          Editar
        </button>
      )}
      {canDeleteResource(resource.user_id) && (
        <button onClick={() => deleteResource(resource)}>
          Eliminar
        </button>
      )}
    </div>
  )
}
```

#### Optimización y Cache
```tsx
// hooks/useResourceCache.ts
import { useQueryClient } from '@tanstack/react-query'

export function useResourceInvalidation() {
  const queryClient = useQueryClient()
  
  return {
    invalidateBuffets: () => queryClient.invalidateQueries(['buffets']),
    invalidateProducts: (buffetId: string) => 
      queryClient.invalidateQueries(['productos', buffetId]),
    invalidateAll: () => queryClient.clear()
  }
}
```

### 9. Consideraciones de Seguridad

1. **Nunca confiar en el frontend**: Los permisos se validan siempre en el backend
2. **Ocultar UI innecesaria**: No mostrar botones/opciones que el usuario no puede usar
3. **Manejo de errores**: Mostrar mensajes apropiados para errores de permisos
4. **Logout automático**: Redirigir al login cuando la sesión expira
5. **Validación de datos**: Usar los mismos schemas de validación que el backend

## Códigos de Error

- `401`: No autenticado
- `403`: Permisos insuficientes
- `400`: Datos inválidos / Validación fallida
- `404`: Recurso no encontrado
- `500`: Error interno del servidor

## Validaciones

- **IDs**: Formato ObjectId válido de MongoDB
- **Fechas**: Formato ISO 8601
- **Precios**: Números >= 0
- **Relaciones**: Existencia y pertenencia correcta
- **Enums**: Valores permitidos para estados y formas de pago