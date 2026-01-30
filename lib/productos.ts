import { MongoClient, Db, Collection, ObjectId, Filter } from 'mongodb';
import clientPromise from './mongodb';
import { Producto, ProductoConBuffet, CrearProductoData, FiltrarProductosData } from '../types/productos';
import { BuffetsService } from './buffets';
import { addUserFilters } from './helpers/permissions';

export class ProductosService {
  private static async getCollection(): Promise<Collection<Producto>> {
    const client: MongoClient = await clientPromise;
    const db: Db = client.db('teo-apis');
    return db.collection<Producto>('productos');
  }

  // Validar que el buffet existe
  private static async validarBuffetExiste(
    buffet_id: string,
    session?: { user: { id: string; role: string } } | null
  ): Promise<boolean> {
    try {
      const buffet = await BuffetsService.obtenerBuffetPorId(buffet_id, session);
      return buffet !== null;
    } catch {
      return false;
    }
  }

  // Crear un nuevo producto
  static async crearProducto(
    data: CrearProductoData,
    session?: { user: { id: string; role: string } } | null
  ): Promise<ProductoConBuffet> {
    // Validar que el buffet existe
    const buffetExiste = await this.validarBuffetExiste(data.buffet_id, session);
    if (!buffetExiste) {
      throw new Error('El buffet especificado no existe o no tienes permisos para acceder a él');
    }

    const collection = await this.getCollection();
    
    const nuevoProducto: Omit<Producto, '_id'> = {
      buffet_id: data.buffet_id,
      user_id: data.user_id,
      nombre: data.nombre,
      valor: data.valor,
      descripcion: data.descripcion,
      imagen: data.imagen,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    const resultado = await collection.insertOne(nuevoProducto as Producto);
    
    const productoCreado = await collection.findOne({ _id: resultado.insertedId });
    
    if (!productoCreado) {
      throw new Error('Error al crear el producto');
    }

    // Obtener datos del buffet para retornar producto completo
    const buffet = await BuffetsService.obtenerBuffetPorId(productoCreado.buffet_id, session);
    
    return {
      ...productoCreado,
      buffet: buffet ? {
        _id: buffet._id!,
        nombre: buffet.nombre,
        lugar: buffet.lugar,
        descripcion: buffet.descripcion
      } : undefined
    };
  }

  // Obtener todos los productos con filtros opcionales
  static async obtenerProductos(
    filtros: FiltrarProductosData = {},
    session?: { user: { id: string; role: string; buffet_id?: string } } | null
  ): Promise<{
    productos: ProductoConBuffet[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    const collection = await this.getCollection();
    
    // Construir query de MongoDB
    let query: Record<string, unknown> = {};
    
    if (filtros.buffet_id) {
      query.buffet_id = filtros.buffet_id;
    }

    if (filtros.user_id) {
      query.user_id = filtros.user_id;
    }
    
    if (filtros.nombre) {
      query.nombre = { $regex: filtros.nombre, $options: 'i' };
    }
    
    if (filtros.valor_min !== undefined || filtros.valor_max !== undefined) {
      query.valor = {} as Record<string, number>;
      if (filtros.valor_min !== undefined) {
        (query.valor as Record<string, number>).$gte = filtros.valor_min;
      }
      if (filtros.valor_max !== undefined) {
        (query.valor as Record<string, number>).$lte = filtros.valor_max;
      }
    }

    // Aplicar filtros de usuario según permisos
    query = addUserFilters(session || null, query);

    // Paginación
    const limite = filtros.limite || 20;
    const pagina = filtros.pagina || 1;
    const skip = (pagina - 1) * limite;

    // Ejecutar consultas en paralelo
    const [productos, total] = await Promise.all([
      collection
        .find(query)
        .sort({ fechaCreacion: -1 })
        .skip(skip)
        .limit(limite)
        .toArray(),
      collection.countDocuments(query)
    ]);

    // Obtener datos de buffets para cada producto
    const productosConBuffets: ProductoConBuffet[] = await Promise.all(
      productos.map(async (producto) => {
        const buffet = await BuffetsService.obtenerBuffetPorId(producto.buffet_id, session);
        return {
          ...producto,
          buffet: buffet ? {
            _id: buffet._id!,
            nombre: buffet.nombre,
            lugar: buffet.lugar,
            descripcion: buffet.descripcion
          } : undefined
        };
      })
    );

    return {
      productos: productosConBuffets,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite)
    };
  }

  // Obtener un producto por ID
  static async obtenerProductoPorId(
    id: string,
    session?: { user: { id: string; role: string } } | null
  ): Promise<ProductoConBuffet | null> {
    const collection = await this.getCollection();

    try {
      const objectId = new ObjectId(id);
      let query: Record<string, unknown> = { _id: objectId };
      
      // Aplicar filtros de usuario según permisos
      query = addUserFilters(session || null, query);
      
      const producto = await collection.findOne(query as unknown as Filter<Producto>);

      if (!producto) {
        return null;
      }

      // Obtener datos del buffet
      const buffet = await BuffetsService.obtenerBuffetPorId(producto.buffet_id, session);
      
      return {
        ...producto,
        buffet: buffet ? {
          _id: buffet._id!,
          nombre: buffet.nombre,
          lugar: buffet.lugar,
          descripcion: buffet.descripcion
        } : undefined
      };
    } catch {
      throw new Error('ID de producto inválido');
    }
  }

  // Actualizar un producto
  static async actualizarProducto(
    id: string, 
    data: Partial<CrearProductoData>,
    session?: { user: { id: string; role: string } } | null
  ): Promise<ProductoConBuffet | null> {
    // Si se está actualizando el buffet_id, validar que existe
    if (data.buffet_id) {
      const buffetExiste = await this.validarBuffetExiste(data.buffet_id, session);
      if (!buffetExiste) {
        throw new Error('El buffet especificado no existe o no tienes permisos para acceder a él');
      }
    }

    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      let query: Record<string, unknown> = { _id: objectId };
      
      // Aplicar filtros de usuario según permisos
      query = addUserFilters(session || null, query);
      
      const datosActualizacion: Record<string, unknown> = {
        ...data,
        fechaActualizacion: new Date()
      };

      await collection.updateOne(
        query as unknown as Filter<Producto>,
        { $set: datosActualizacion }
      );

      return await this.obtenerProductoPorId(id, session);
    } catch {
      throw new Error('ID de producto inválido');
    }
  }

  // Eliminar un producto
  static async eliminarProducto(
    id: string,
    session?: { user: { id: string; role: string } } | null
  ): Promise<boolean> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      let query: Record<string, unknown> = { _id: objectId };
      
      // Aplicar filtros de usuario según permisos
      query = addUserFilters(session || null, query);
      
      const resultado = await collection.deleteOne(query as unknown as Filter<Producto>);
      return resultado.deletedCount === 1;
    } catch {
      throw new Error('ID de producto inválido');
    }
  }

  // Obtener productos por buffet
  static async obtenerProductosPorBuffet(
    buffet_id: string,
    session?: { user: { id: string; role: string } } | null
  ): Promise<Producto[]> {
    const collection = await this.getCollection();
    
    let query: Record<string, unknown> = { buffet_id };
    
    // Aplicar filtros de usuario según permisos
    query = addUserFilters(session || null, query);
    
    return await collection
      .find(query)
      .sort({ nombre: 1 })
      .toArray();
  }

    static async obtenerProductosPorBuffetPublic(
    buffet_id: string,
  ): Promise<Producto[]> {
    const collection = await this.getCollection();
    
    const query = { buffet_id };
    
    return await collection
      .find(query)
      .sort({ nombre: 1 })
      .toArray();
  }

  // Obtener estadísticas de productos por buffet
  static async obtenerEstadisticasProductos(
    buffet_id?: string,
    session?: { user: { id: string; role: string } } | null
  ): Promise<{
    totalProductos: number;
    valorPromedio: number;
    valorMinimo: number;
    valorMaximo: number;
  }> {
    const collection = await this.getCollection();
    
    let query: Record<string, unknown> = buffet_id ? { buffet_id } : {};
    
    // Aplicar filtros de usuario según permisos
    query = addUserFilters(session || null, query);
    
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          totalProductos: { $sum: 1 },
          valorPromedio: { $avg: "$valor" },
          valorMinimo: { $min: "$valor" },
          valorMaximo: { $max: "$valor" }
        }
      }
    ];

    const resultado = await collection.aggregate(pipeline).toArray();
    
    if (resultado.length === 0) {
      return {
        totalProductos: 0,
        valorPromedio: 0,
        valorMinimo: 0,
        valorMaximo: 0
      };
    }

    return {
      totalProductos: resultado[0].totalProductos,
      valorPromedio: Math.round(resultado[0].valorPromedio * 100) / 100,
      valorMinimo: resultado[0].valorMinimo,
      valorMaximo: resultado[0].valorMaximo
    };
  }
}

// Funciones exportadas para uso en las APIs
export const crearProducto = ProductosService.crearProducto.bind(ProductosService);
export const obtenerProductos = ProductosService.obtenerProductos.bind(ProductosService);
export const obtenerProductoPorId = ProductosService.obtenerProductoPorId.bind(ProductosService);
export const actualizarProducto = ProductosService.actualizarProducto.bind(ProductosService);
export const eliminarProducto = ProductosService.eliminarProducto.bind(ProductosService);
export const obtenerProductosPorBuffetPublic = ProductosService.obtenerProductosPorBuffetPublic.bind(ProductosService)