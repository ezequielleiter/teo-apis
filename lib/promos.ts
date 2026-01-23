import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import clientPromise from './mongodb';
import { Promo, PromoConDetalles, CrearPromoData, FiltrarPromosData } from '../types/promos';
import { BuffetsService } from './buffets';
import { ProductosService } from './productos';

export class PromosService {
  private static async getCollection(): Promise<Collection<Promo>> {
    const client: MongoClient = await clientPromise;
    const db: Db = client.db('teo-apis');
    return db.collection<Promo>('promos');
  }

  // Validar que el buffet existe
  private static async validarBuffetExiste(buffet_id: string): Promise<boolean> {
    try {
      const buffet = await BuffetsService.obtenerBuffetPorId(buffet_id);
      return buffet !== null;
    } catch {
      return false;
    }
  }

  // Validar que los productos existen y pertenecen al buffet
  private static async validarProductos(buffet_id: string, productos_ids: string[]): Promise<boolean> {
    try {
      for (const producto_id of productos_ids) {
        const producto = await ProductosService.obtenerProductoPorId(producto_id);
        if (!producto || producto.buffet_id !== buffet_id) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  // Obtener detalles de productos para una promo
  private static async obtenerDetallesProductos(productos_ids: string[]) {
    const productosDetalles = await Promise.all(
      productos_ids.map(async (producto_id) => {
        const producto = await ProductosService.obtenerProductoPorId(producto_id);
        return producto ? {
          _id: producto._id!,
          nombre: producto.nombre,
          valor: producto.valor,
          descripcion: producto.descripcion
        } : null;
      })
    );
    
    return productosDetalles.filter(producto => producto !== null);
  }

  // Crear una nueva promo
  static async crearPromo(data: CrearPromoData): Promise<PromoConDetalles> {
    // Validar que el buffet existe
    const buffetExiste = await this.validarBuffetExiste(data.buffet_id);
    if (!buffetExiste) {
      throw new Error('El buffet especificado no existe');
    }

    // Validar que todos los productos existen y pertenecen al buffet
    const productosValidos = await this.validarProductos(data.buffet_id, data.productos);
    if (!productosValidos) {
      throw new Error('Uno o más productos no existen o no pertenecen al buffet especificado');
    }

    const collection = await this.getCollection();
    
    const nuevaPromo: Omit<Promo, '_id'> = {
      buffet_id: data.buffet_id,
      nombre: data.nombre,
      productos: data.productos,
      valor: data.valor,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    const resultado = await collection.insertOne(nuevaPromo as Promo);
    
    const promoCreada = await collection.findOne({ _id: resultado.insertedId });
    
    if (!promoCreada) {
      throw new Error('Error al crear la promo');
    }

    // Obtener datos del buffet y productos para retornar promo completa
    const [buffet, productosDetalles] = await Promise.all([
      BuffetsService.obtenerBuffetPorId(promoCreada.buffet_id),
      this.obtenerDetallesProductos(promoCreada.productos)
    ]);

    const valorTotalProductos = productosDetalles.reduce((total, producto) => total + producto.valor, 0);
    const descuento = valorTotalProductos - promoCreada.valor;
    
    return {
      ...promoCreada,
      buffet: buffet ? {
        _id: buffet._id!,
        nombre: buffet.nombre,
        lugar: buffet.lugar,
        descripcion: buffet.descripcion
      } : undefined,
      productosDetalles,
      valorTotalProductos,
      descuento: descuento > 0 ? descuento : 0
    };
  }

  // Obtener todas las promos con filtros opcionales
  static async obtenerPromos(filtros: FiltrarPromosData = {}): Promise<{
    promos: PromoConDetalles[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    const collection = await this.getCollection();
    
    // Construir query de MongoDB
    const query: Record<string, unknown> = {};
    
    if (filtros.buffet_id) {
      query.buffet_id = filtros.buffet_id;
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

    // Paginación
    const limite = filtros.limite || 20;
    const pagina = filtros.pagina || 1;
    const skip = (pagina - 1) * limite;

    // Ejecutar consultas en paralelo
    const [promos, total] = await Promise.all([
      collection
        .find(query)
        .sort({ fechaCreacion: -1 })
        .skip(skip)
        .limit(limite)
        .toArray(),
      collection.countDocuments(query)
    ]);

    // Obtener datos de buffets y productos para cada promo
    const promosConDetalles: PromoConDetalles[] = await Promise.all(
      promos.map(async (promo) => {
        const [buffet, productosDetalles] = await Promise.all([
          BuffetsService.obtenerBuffetPorId(promo.buffet_id),
          this.obtenerDetallesProductos(promo.productos)
        ]);

        const valorTotalProductos = productosDetalles.reduce((total, producto) => total + producto.valor, 0);
        const descuento = valorTotalProductos - promo.valor;

        return {
          ...promo,
          buffet: buffet ? {
            _id: buffet._id!,
            nombre: buffet.nombre,
            lugar: buffet.lugar,
            descripcion: buffet.descripcion
          } : undefined,
          productosDetalles,
          valorTotalProductos,
          descuento: descuento > 0 ? descuento : 0
        };
      })
    );

    return {
      promos: promosConDetalles,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite)
    };
  }

  // Obtener una promo por ID
  static async obtenerPromoPorId(id: string): Promise<PromoConDetalles | null> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const promo = await collection.findOne({ _id: objectId } as any);
      
      if (!promo) {
        return null;
      }

      // Obtener datos del buffet y productos
      const [buffet, productosDetalles] = await Promise.all([
        BuffetsService.obtenerBuffetPorId(promo.buffet_id),
        this.obtenerDetallesProductos(promo.productos)
      ]);

      const valorTotalProductos = productosDetalles.reduce((total, producto) => total + producto.valor, 0);
      const descuento = valorTotalProductos - promo.valor;
      
      return {
        ...promo,
        buffet: buffet ? {
          _id: buffet._id!,
          nombre: buffet.nombre,
          lugar: buffet.lugar,
          descripcion: buffet.descripcion
        } : undefined,
        productosDetalles,
        valorTotalProductos,
        descuento: descuento > 0 ? descuento : 0
      };
    } catch {
      throw new Error('ID de promo inválido');
    }
  }

  // Actualizar una promo
  static async actualizarPromo(id: string, data: Partial<CrearPromoData>): Promise<PromoConDetalles | null> {
    // Si se está actualizando el buffet_id, validar que existe
    if (data.buffet_id) {
      const buffetExiste = await this.validarBuffetExiste(data.buffet_id);
      if (!buffetExiste) {
        throw new Error('El buffet especificado no existe');
      }
    }

    // Si se están actualizando productos, validar que existen y pertenecen al buffet
    if (data.productos) {
      const buffet_id = data.buffet_id || (await this.obtenerPromoPorId(id))?.buffet_id;
      if (buffet_id) {
        const productosValidos = await this.validarProductos(buffet_id, data.productos);
        if (!productosValidos) {
          throw new Error('Uno o más productos no existen o no pertenecen al buffet especificado');
        }
      }
    }

    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      const datosActualizacion: Record<string, unknown> = {
        ...data,
        fechaActualizacion: new Date()
      };

      await collection.updateOne(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { _id: objectId } as unknown as any,
        { $set: datosActualizacion }
      );

      return await this.obtenerPromoPorId(id);
    } catch {
      throw new Error('ID de promo inválido');
    }
  }

  // Eliminar una promo
  static async eliminarPromo(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultado = await collection.deleteOne({ _id: objectId } as any);
      return resultado.deletedCount === 1;
    } catch {
      throw new Error('ID de promo inválido');
    }
  }

  // Obtener promos por buffet
  static async obtenerPromosPorBuffet(buffet_id: string): Promise<Promo[]> {
    const collection = await this.getCollection();
    
    return await collection
      .find({ buffet_id })
      .sort({ fechaCreacion: -1 })
      .toArray();
  }
}