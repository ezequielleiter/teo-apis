import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import clientPromise from './mongodb';
import { Banner, BannerConDetalles, CrearBannerData, FiltrarBannersData } from '../types/banners';
import { BuffetsService } from './buffets';
import { addUserFilters, validateUserPermissions } from './helpers/permissions';

export class BannersService {
  private static async getCollection(): Promise<Collection<Banner>> {
    const client: MongoClient = await clientPromise;
    const db: Db = client.db('teo-apis');
    return db.collection<Banner>('banners');
  }

  // Validar que el buffet existe
  private static async validarBuffetExiste(
    buffet_id: string, 
    session?: { user: { id: string; role: string; buffet_id?: string } } | null
  ): Promise<boolean> {
    try {
      const buffet = await BuffetsService.obtenerBuffetPorId(buffet_id, session);
      return buffet !== null;
    } catch {
      return false;
    }
  }

  // Crear un nuevo banner
  static async crearBanner(
    datos: CrearBannerData,
    session?: { user: { id: string; role: string; buffet_id?: string } } | null
  ): Promise<BannerConDetalles> {
    // Validar que el buffet existe
    if (!(await this.validarBuffetExiste(datos.buffet_id, session))) {
      throw new Error('El buffet especificado no existe');
    }

    const collection = await this.getCollection();

    const ahora = new Date();
    const nuevoBanner: Banner = {
      ...datos,
      fechaCreacion: ahora,
      fechaActualizacion: ahora
    };

    const resultado = await collection.insertOne(nuevoBanner);

    return this.obtenerBannerPorId(resultado.insertedId.toString(), session) as Promise<BannerConDetalles>;
  }

  // Obtener banner por ID
  static async obtenerBannerPorId(
    id: string,
    session?: { user: { id: string; role: string; buffet_id?: string } } | null
  ): Promise<BannerConDetalles | null> {
    const collection = await this.getCollection();
    
    let query: any = { _id: new ObjectId(id) };
    
    // Aplicar filtros de usuario (admins solo ven sus buffets)
    query = addUserFilters(session || null, query);

    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'buffets',
          localField: 'buffet_id',
          foreignField: '_id',
          as: 'buffetData'
        }
      },
      {
        $addFields: {
          buffet: { $arrayElemAt: ['$buffetData', 0] }
        }
      },
      {
        $project: {
          buffetData: 0
        }
      }
    ];

    const resultados = await collection.aggregate<BannerConDetalles>(pipeline).toArray();
    return resultados.length > 0 ? resultados[0] : null;
  }

  // Obtener banners con filtros
  static async obtenerBanners(
    filtros: FiltrarBannersData,
    session?: { user: { id: string; role: string; buffet_id?: string } } | null
  ): Promise<{ banners: BannerConDetalles[]; total: number; pagina: number; totalPaginas: number }> {
    const collection = await this.getCollection();
    
    // Construir query base
    let query: any = {};

    // Aplicar filtros
    if (filtros.buffet_id) {
      query.buffet_id = filtros.buffet_id;
    }

    if (filtros.user_id) {
      query.user_id = filtros.user_id;
    }

    if (filtros.mensaje) {
      query.mensaje = { $regex: filtros.mensaje, $options: 'i' };
    }

    // Aplicar filtros de usuario (admins solo ven sus buffets)
    query = addUserFilters(session || null, query);

    // Paginación
    const limite = filtros.limite || 20;
    const pagina = filtros.pagina || 1;
    const saltar = (pagina - 1) * limite;

    // Pipeline de agregación para obtener banners con datos del buffet
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'buffets',
          localField: 'buffet_id',
          foreignField: '_id',
          as: 'buffetData'
        }
      },
      {
        $addFields: {
          buffet: { $arrayElemAt: ['$buffetData', 0] }
        }
      },
      {
        $project: {
          buffetData: 0
        }
      },
      {
        $sort: { fechaCreacion: -1 }
      },
      {
        $facet: {
          banners: [
            { $skip: saltar },
            { $limit: limite }
          ],
          total: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const resultado = await collection.aggregate<{
      banners: BannerConDetalles[];
      total: { count: number }[];
    }>(pipeline).toArray();

    const banners = resultado[0]?.banners || [];
    const total = resultado[0]?.total[0]?.count || 0;
    const totalPaginas = Math.ceil(total / limite);

    return {
      banners,
      total,
      pagina,
      totalPaginas
    };
  }

  // Actualizar banner
  static async actualizarBanner(
    id: string,
    datos: Partial<CrearBannerData>,
    session?: { user: { id: string; role: string; buffet_id?: string } } | null
  ): Promise<BannerConDetalles | null> {
    const collection = await this.getCollection();
    
    let query: any = { _id: new ObjectId(id) };
    
    // Aplicar filtros de usuario (admins solo ven sus buffets)
    query = addUserFilters(session || null, query);

    // Validar que el banner existe
    const bannerExistente = await collection.findOne(query);
    if (!bannerExistente) {
      throw new Error('Banner no encontrado');
    }

    // Si se está actualizando el buffet_id, validar que el nuevo buffet existe
    if (datos.buffet_id && datos.buffet_id !== bannerExistente.buffet_id) {
      if (!(await this.validarBuffetExiste(datos.buffet_id, session))) {
        throw new Error('El buffet especificado no existe');
      }
    }

    const datosActualizacion = {
      ...datos,
      fechaActualizacion: new Date()
    };

    await collection.updateOne(
      query,
      { $set: datosActualizacion }
    );

    return this.obtenerBannerPorId(id, session);
  }

  // Eliminar banner
  static async eliminarBanner(
    id: string,
    session?: { user: { id: string; role: string; buffet_id?: string } } | null
  ): Promise<void> {
    const collection = await this.getCollection();
    
    let query: any = { _id: new ObjectId(id) };
    
    // Aplicar filtros de usuario (admins solo pueden eliminar banners de sus buffets)
    query = addUserFilters(session || null, query);
    
    const resultado = await collection.deleteOne(query);

    if (resultado.deletedCount === 0) {
      throw new Error('Banner no encontrado o no tienes permisos para eliminarlo');
    }
  }
}

// Funciones auxiliares para mantener compatibilidad con la estructura existente
export async function obtenerBannerPorId(
  id: string,
  session?: { user: { id: string; role: string; buffet_id?: string } } | null
): Promise<BannerConDetalles | null> {
  return BannersService.obtenerBannerPorId(id, session);
}

export async function actualizarBanner(
  id: string,
  datos: Partial<CrearBannerData>,
  session?: { user: { id: string; role: string; buffet_id?: string } } | null
): Promise<BannerConDetalles | null> {
  return BannersService.actualizarBanner(id, datos, session);
}

export async function eliminarBanner(
  id: string,
  session?: { user: { id: string; role: string; buffet_id?: string } } | null
): Promise<void> {
  return BannersService.eliminarBanner(id, session);
}