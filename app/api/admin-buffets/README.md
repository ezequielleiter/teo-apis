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
GET /api/admin-buffets/buffets?nombre=Central&lugar=Ciudad&limite=10&pagina=1
```

**Parámetros de consulta:**
- `nombre` (string): Búsqueda por nombre (case-insensitive)
- `lugar` (string): Búsqueda por lugar (case-insensitive)
- `limite` (number): Elementos por página (1-100, default: 20)
- `pagina` (number): Número de página (default: 1)

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
GET /api/admin-buffets/eventos?buffet_id=65f1234567890abcdef12345&fecha_desde=2026-02-01T00:00:00.000Z&fecha_hasta=2026-02-28T23:59:59.999Z
```

**Parámetros de consulta:**
- `buffet_id` (string): Filtrar por buffet específico
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
GET /api/admin-buffets/productos?buffet_id=65f1234567890abcdef12345&nombre=Parrillada&valor_min=20&valor_max=50
```

**Parámetros de consulta:**
- `buffet_id` (string): Filtrar por buffet específico
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
GET /api/admin-buffets/promos?buffet_id=65f1234567890abcdef12345&nombre=Combo&valor_min=40&valor_max=60
```

**Parámetros de consulta:**
- `buffet_id` (string): Filtrar por buffet específico
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
GET /api/admin-buffets/ordenes?buffet_id=65f1234567890abcdef12345&estado=pendiente&forma_pago=efectivo&nota=sin
```

**Parámetros de consulta:**
- `buffet_id` (string): Filtrar por buffet específico
- `evento_id` (string): Filtrar por evento específico
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
  fechaCreacion: Date;
  fechaActualizacion: Date;
}
```

#### Producto
```typescript
{
  _id?: string;
  buffet_id: string;
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

### 1. Integridad Referencial

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