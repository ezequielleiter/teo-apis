import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { Session } from 'next-auth';
import clientPromise from './mongodb';
import { 
  Orden, 
  OrdenConDetalles, 
  CrearOrdenData, 
  FiltrarOrdenesData,
  ItemProducto,
  ProductoExpandido,
  EstadoOrden,
  ActualizarEstadoOrdenData
} from '../types/ordenes';
import { BuffetsService } from './buffets';
import { EventosService } from './eventos';
import { ProductosService } from './productos';
import { PromosService } from './promos';
import { addUserFilters } from './helpers/permissions';

export class OrdenesService {
  private static async getCollection(): Promise<Collection<Orden>> {
    const client: MongoClient = await clientPromise;
    const db: Db = client.db('teo-apis');
    return db.collection<Orden>('ordenes');
  }

  // Validar que el buffet existe
  private static async validarBuffetExiste(buffet_id: string, session?: Session | null): Promise<boolean> {
    try {
      const buffet = await BuffetsService.obtenerBuffetPorId(buffet_id, session);
      return buffet !== null;
    } catch {
      return false;
    }
  }

  // Validar que el evento existe y pertenece al buffet
  private static async validarEvento(evento_id: string, buffet_id: string): Promise<boolean> {
    try {
      const evento = await EventosService.obtenerEventoPorId(evento_id);
      return evento !== null && evento.buffet_id === buffet_id;
    } catch {
      return false;
    }
  }

  // Expandir productos de una orden (incluye productos de promos)
  private static async expandirProductos(productos: ItemProducto[], session?: Session | null): Promise<ProductoExpandido[]> {
    const productosExpandidos: ProductoExpandido[] = [];

    for (const item of productos) {
      if (item.tipo === 'producto') {
        // Producto individual
        const producto = await ProductosService.obtenerProductoPorId(item.id);
        if (producto) {
          productosExpandidos.push({
            producto_id: producto._id!,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio_unitario: item.precio_unitario,
            cantidad: item.cantidad,
            subtotal: item.precio_unitario * item.cantidad,
            origen: {
              tipo: 'producto',
              id: producto._id!,
              nombre: producto.nombre
            }
          });
        }
      } else if (item.tipo === 'promo') {
        // Promo - expandir todos los productos que la componen
        const promo = await PromosService.obtenerPromoPorId(item.id, session);
        if (promo && promo.productosDetalles) {
          for (const productoPromo of promo.productosDetalles) {
            productosExpandidos.push({
              producto_id: productoPromo._id,
              nombre: productoPromo.nombre,
              descripcion: productoPromo.descripcion,
              precio_unitario: item.precio_unitario / promo.productosDetalles.length, // Distribuir precio de promo
              cantidad: item.cantidad,
              subtotal: (item.precio_unitario / promo.productosDetalles.length) * item.cantidad,
              origen: {
                tipo: 'promo',
                id: promo._id!,
                nombre: promo.nombre
              }
            });
          }
        }
      }
    }

    return productosExpandidos;
  }

  // Validar productos y promos de una orden
  private static async validarProductosYPromos(buffet_id: string, productos: ItemProducto[], session?: Session | null): Promise<boolean> {
    try {
      for (const item of productos) {
        if (item.tipo === 'producto') {
          const producto = await ProductosService.obtenerProductoPorId(item.id);
          if (!producto || producto.buffet_id !== buffet_id) {
            return false;
          }
        } else if (item.tipo === 'promo') {
          const promo = await PromosService.obtenerPromoPorId(item.id, session);
          if (!promo || promo.buffet_id !== buffet_id) {
            return false;
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  // Crear una nueva orden
  static async crearOrden(data: CrearOrdenData, session?: Session | null): Promise<OrdenConDetalles> {
    // Validar que el buffet existe
    const buffetExiste = await this.validarBuffetExiste(data.buffet_id, session);
    if (!buffetExiste) {
      throw new Error('El buffet especificado no existe');
    }
 
    // Validar que el evento existe y pertenece al buffet
    const eventoValido = await this.validarEvento(data.evento_id, data.buffet_id);
    if (!eventoValido) {
      throw new Error('El evento especificado no existe o no pertenece al buffet');
    }

    // Validar que todos los productos/promos existen y pertenecen al buffet
    const productosValidos = await this.validarProductosYPromos(data.buffet_id, data.productos, session);
    if (!productosValidos) {
      throw new Error('Uno o más productos/promos no existen o no pertenecen al buffet especificado');
    }

    // Expandir productos (incluir productos de promos)
    const productosExpandidos = await this.expandirProductos(data.productos, session);

    const collection = await this.getCollection();
    
    const nuevaOrden: Omit<Orden, '_id'> = {
      buffet_id: data.buffet_id,
      evento_id: data.evento_id,
      productos: data.productos,
      productosExpandidos,
      total: data.total,
      forma_pago: data.forma_pago,
      nota: data.nota,
      estado: data.estado,
      user_id: data.user_id,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    const resultado = await collection.insertOne(nuevaOrden as Orden);
    
    const ordenCreada = await collection.findOne({ _id: resultado.insertedId });
    
    if (!ordenCreada) {
      throw new Error('Error al crear la orden');
    }

    // Obtener datos del buffet y evento para retornar orden completa
    const [buffet, evento] = await Promise.all([
      BuffetsService.obtenerBuffetPorId(ordenCreada.buffet_id, session),
      EventosService.obtenerEventoPorId(ordenCreada.evento_id)
    ]);
    
    return {
      ...ordenCreada,
      buffet: buffet ? {
        _id: buffet._id!,
        nombre: buffet.nombre,
        lugar: buffet.lugar,
        descripcion: buffet.descripcion
      } : undefined,
      evento: evento ? {
        _id: evento._id!,
        fecha: evento.fecha
      } : undefined
    };
  }

  // Obtener todas las órdenes con filtros opcionales
  static async obtenerOrdenes(
    filtros: FiltrarOrdenesData = {},
    session?: Session | null
  ): Promise<{
    ordenes: OrdenConDetalles[];
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
    
    if (filtros.evento_id) {
      query.evento_id = filtros.evento_id;
    }
    
    if (filtros.estado) {
      query.estado = filtros.estado;
    }
    
    if (filtros.forma_pago) {
      query.forma_pago = filtros.forma_pago;
    }
    
    if (filtros.nota) {
      query.nota = { $regex: filtros.nota, $options: 'i' };
    }
    
    if (filtros.user_id) {
      query.user_id = filtros.user_id;
    }
    
    if (filtros.fecha_desde || filtros.fecha_hasta) {
      query.fechaCreacion = {} as Record<string, Date>;
      if (filtros.fecha_desde) {
        (query.fechaCreacion as Record<string, Date>).$gte = new Date(filtros.fecha_desde);
      }
      if (filtros.fecha_hasta) {
        (query.fechaCreacion as Record<string, Date>).$lte = new Date(filtros.fecha_hasta);
      }
    }
    
    if (filtros.total_min !== undefined || filtros.total_max !== undefined) {
      query.total = {} as Record<string, number>;
      if (filtros.total_min !== undefined) {
        (query.total as Record<string, number>).$gte = filtros.total_min;
      }
      if (filtros.total_max !== undefined) {
        (query.total as Record<string, number>).$lte = filtros.total_max;
      }
    }
    
    // Aplicar filtros de usuario según permisos
    query = addUserFilters(session || null, query);

    // Paginación
    const limite = filtros.limite || 20;
    const pagina = filtros.pagina || 1;
    const skip = (pagina - 1) * limite;

    // Ejecutar consultas en paralelo
    const [ordenes, total] = await Promise.all([
      collection
        .find(query)
        .sort({ fechaCreacion: -1 })
        .skip(skip)
        .limit(limite)
        .toArray(),
      collection.countDocuments(query)
    ]);

    // Obtener datos de buffets y eventos para cada orden
    const ordenesConDetalles: OrdenConDetalles[] = await Promise.all(
      ordenes.map(async (orden) => {
        const [buffet, evento] = await Promise.all([
          BuffetsService.obtenerBuffetPorId(orden.buffet_id, session),
          EventosService.obtenerEventoPorId(orden.evento_id)
        ]);

        return {
          ...orden,
          buffet: buffet ? {
            _id: buffet._id!,
            nombre: buffet.nombre,
            lugar: buffet.lugar,
            descripcion: buffet.descripcion
          } : undefined,
          evento: evento ? {
            _id: evento._id!,
            fecha: evento.fecha
          } : undefined
        };
      })
    );

    return {
      ordenes: ordenesConDetalles,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite)
    };
  }

  // Obtener una orden por ID
  static async obtenerOrdenPorId(id: string, session?: Session | null): Promise<OrdenConDetalles | null> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      let query: Record<string, unknown> = { _id: objectId };
      
      // Aplicar filtros de usuario según permisos
      query = addUserFilters(session || null, query);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orden = await collection.findOne(query as any);
      
      if (!orden) {
        return null;
      }

      // Obtener datos del buffet y evento
      const [buffet, evento] = await Promise.all([
        BuffetsService.obtenerBuffetPorId(orden.buffet_id, session),
        EventosService.obtenerEventoPorId(orden.evento_id)
      ]);
      
      return {
        ...orden,
        buffet: buffet ? {
          _id: buffet._id!,
          nombre: buffet.nombre,
          lugar: buffet.lugar,
          descripcion: buffet.descripcion
        } : undefined,
        evento: evento ? {
          _id: evento._id!,
          fecha: evento.fecha
        } : undefined
      };
    } catch {
      throw new Error('ID de orden inválido');
    }
  }

  // Actualizar estado de una orden
  static async actualizarEstadoOrden(id: string, data: ActualizarEstadoOrdenData, session?: Session | null): Promise<OrdenConDetalles | null> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      const datosActualizacion = {
        estado: data.estado,
        fechaActualizacion: new Date()
      };

      await collection.updateOne(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { _id: objectId } as unknown as any,
        { $set: datosActualizacion }
      );

      return await this.obtenerOrdenPorId(id, session);
    } catch {
      throw new Error('ID de orden inválido');
    }
  }

  // Actualizar una orden
  static async actualizarOrden(id: string, data: Partial<CrearOrdenData>, session?: Session | null): Promise<OrdenConDetalles | null> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      const buffet_id = data.buffet_id || (await this.obtenerOrdenPorId(id, session))?.buffet_id;

      // Verificar permisos si se proporciona sessión
      if (session) {
        await this.validateUserPermissions(buffet_id, session);
      }
      
      const updateData = {
        ...data,
        fechaActualizacion: new Date()
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await collection.updateOne({ _id: objectId } as any, { $set: updateData });
      
      return await this.obtenerOrdenPorId(id, session);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('permisos')) {
        throw error;
      }
      throw new Error('ID de orden inválido');
    }
  }

  // Eliminar una orden
  static async eliminarOrden(id: string, session?: Session | null): Promise<boolean> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      
      // Verificar permisos si se proporciona sessión
      if (session) {
        const orden = await this.obtenerOrdenPorId(id, session);
        if (!orden) {
          throw new Error('Orden no encontrada');
        }
        await this.validateUserPermissions(orden.buffet_id, session);
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultado = await collection.deleteOne({ _id: objectId } as any);
      return resultado.deletedCount === 1;
    } catch (error: unknown) {
      if (error instanceof Error && (error.message.includes('permisos') || error.message.includes('encontrada'))) {
        throw error;
      }
      throw new Error('ID de orden inválido');
    }
  }

  // Obtener órdenes por buffet
  static async obtenerOrdenesPorBuffet(buffet_id: string): Promise<Orden[]> {
    const collection = await this.getCollection();
    
    return await collection
      .find({ buffet_id })
      .sort({ fechaCreacion: -1 })
      .toArray();
  }

  // Obtener órdenes por evento
  static async obtenerOrdenesPorEvento(evento_id: string): Promise<Orden[]> {
    const collection = await this.getCollection();
    
    return await collection
      .find({ evento_id })
      .sort({ fechaCreacion: -1 })
      .toArray();
  }

  // Validar permisos de usuario para un buffet específico
  private static async validateUserPermissions(buffet_id: string | undefined, session: Session): Promise<void> {
    if (!buffet_id) {
      throw new Error('ID de buffet requerido para validar permisos');
    }

    // Verificar si el usuario es superadmin
    if (session.user?.role === 'superadmin') {
      return; // Superadmin tiene acceso a todo
    }

    // Verificar si el usuario es admin del buffet específico
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (session.user?.role === 'admin' && (session.user as any)?.buffet_id === buffet_id) {
      return; // Admin del buffet tiene acceso
    }

    throw new Error('No tienes permisos para realizar esta acción en este buffet');
  }

  // Obtener estadísticas de órdenes
  static async obtenerEstadisticasOrdenes(buffet_id?: string, evento_id?: string): Promise<{
    totalOrdenes: number;
    ordenesPendientes: number;
    ordenesEntregadas: number;
    ordenesCanceladas: number;
    ventaTotal: number;
    ventaPromedio: number;
  }> {
    const collection = await this.getCollection();
    
    const query: Record<string, unknown> = {};
    if (buffet_id) query.buffet_id = buffet_id;
    if (evento_id) query.evento_id = evento_id;
    
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrdenes: { $sum: 1 },
          ordenesPendientes: {
            $sum: { $cond: [{ $eq: ["$estado", EstadoOrden.PENDIENTE] }, 1, 0] }
          },
          ordenesEntregadas: {
            $sum: { $cond: [{ $eq: ["$estado", EstadoOrden.ENTREGADO] }, 1, 0] }
          },
          ordenesCanceladas: {
            $sum: { $cond: [{ $eq: ["$estado", EstadoOrden.CANCELADO] }, 1, 0] }
          },
          ventaTotal: { $sum: "$total" },
          ventaPromedio: { $avg: "$total" }
        }
      }
    ];

    const resultado = await collection.aggregate(pipeline).toArray();
    
    if (resultado.length === 0) {
      return {
        totalOrdenes: 0,
        ordenesPendientes: 0,
        ordenesEntregadas: 0,
        ordenesCanceladas: 0,
        ventaTotal: 0,
        ventaPromedio: 0
      };
    }

    return {
      totalOrdenes: resultado[0].totalOrdenes,
      ordenesPendientes: resultado[0].ordenesPendientes,
      ordenesEntregadas: resultado[0].ordenesEntregadas,
      ordenesCanceladas: resultado[0].ordenesCanceladas,
      ventaTotal: Math.round(resultado[0].ventaTotal * 100) / 100,
      ventaPromedio: Math.round(resultado[0].ventaPromedio * 100) / 100
    };
  }
}

// Funciones exportadas para uso en las APIs
export const crearOrden = OrdenesService.crearOrden.bind(OrdenesService);
export const obtenerOrdenes = OrdenesService.obtenerOrdenes.bind(OrdenesService);
export const obtenerOrdenPorId = OrdenesService.obtenerOrdenPorId.bind(OrdenesService);
export const actualizarOrden = OrdenesService.actualizarOrden.bind(OrdenesService);
export const eliminarOrden = OrdenesService.eliminarOrden.bind(OrdenesService);