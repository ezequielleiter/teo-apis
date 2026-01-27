import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ProductosService } from '../../../../lib/productos';
import { 
  crearProductoSchema,
  filtrarProductosSchema 
} from '../../../../types/productos';
import { requireAuth } from '../../../../lib/helpers/jwt-auth';
import { UserRole } from '../../../../types/auth';

// GET /api/admin-buffets/productos - Obtener todos los productos
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['admin', 'superadmin']);
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    
    // Extraer parámetros de consulta
    const filtros: Record<string, unknown> = {};
    
    if (searchParams.get('buffet_id')) {
      filtros.buffet_id = searchParams.get('buffet_id');
    }

    if (searchParams.get('user_id')) {
      filtros.user_id = searchParams.get('user_id');
    }
    
    if (searchParams.get('nombre')) {
      filtros.nombre = searchParams.get('nombre');
    }
    
    if (searchParams.get('valor_min')) {
      filtros.valor_min = parseFloat(searchParams.get('valor_min') || '0');
    }
    
    if (searchParams.get('valor_max')) {
      filtros.valor_max = parseFloat(searchParams.get('valor_max') || '0');
    }
    
    if (searchParams.get('limite')) {
      filtros.limite = parseInt(searchParams.get('limite') || '20');
    }
    
    if (searchParams.get('pagina')) {
      filtros.pagina = parseInt(searchParams.get('pagina') || '1');
    }

    // Validar parámetros
    const filtrosValidados = filtrarProductosSchema.parse(filtros);

    // Crear objeto compatible con Session
    const sessionCompatible = { 
      user: {
        ...user,
        role: user.role as UserRole // Cast para compatibilidad
      }, 
      expires: new Date().toISOString() 
    };

    // Obtener productos
    const resultado = await ProductosService.obtenerProductos(filtrosValidados, sessionCompatible);

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('Error al obtener productos:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Parámetros inválidos', 
          details: error.issues 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/admin-buffets/productos - Crear un nuevo producto
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['admin', 'superadmin']);
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;

    const body = await request.json();
    
    // Agregar user_id del usuario actual
    const bodyConUserId = {
      ...body,
      user_id: user.id
    };
    
    // Validar datos
    const datosValidados = crearProductoSchema.parse(bodyConUserId);

    // Crear objeto compatible con Session
    const sessionCompatible = { 
      user: {
        ...user,
        role: user.role as UserRole // Cast para compatibilidad
      }, 
      expires: new Date().toISOString() 
    };

    // Crear producto
    const nuevoProducto = await ProductosService.crearProducto(datosValidados, sessionCompatible);

    return NextResponse.json(
      { 
        message: 'Producto creado exitosamente',
        producto: nuevoProducto 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error al crear producto:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: error.issues 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}