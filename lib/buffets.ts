import { MongoClient, Db, Collection, ObjectId, Filter } from 'mongodb';
import clientPromise from './mongodb';
import { Buffet, CrearBuffetData, FiltrarBuffetsData } from '../types/buffets';
import { addUserFilters } from './helpers/permissions';

export class BuffetsService {
  private static async getCollection(): Promise<Collection<Buffet>> {
    const client: MongoClient = await clientPromise;
    const db: Db = client.db('teo-apis');
    return db.collection<Buffet>('buffets');
  }

  // Crear un nuevo buffet
  static async crearBuffet(data: CrearBuffetData): Promise<Buffet> {
    const collection = await this.getCollection();
    
    const nuevoBuffet: Omit<Buffet, '_id'> = {
      ...data,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    const resultado = await collection.insertOne(nuevoBuffet as Buffet);
    
    const buffetCreado = await collection.findOne({ _id: resultado.insertedId });
    
    if (!buffetCreado) {
      throw new Error('Error al crear el buffet');
    }

    return buffetCreado;
  }

  // Obtener todos los buffets con filtros opcionales
  static async obtenerBuffets(
    filtros: FiltrarBuffetsData = {},
    session?: { user: { id: string; role: string } } | null
  ): Promise<{
    buffets: Buffet[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    const collection = await this.getCollection();
    
    // Construir query de MongoDB
    let query: Record<string, unknown> = {};
    
    if (filtros.nombre) {
      query.nombre = { $regex: filtros.nombre, $options: 'i' };
    }
    
    if (filtros.lugar) {
      query.lugar = { $regex: filtros.lugar, $options: 'i' };
    }

    if (filtros.user_id) {
      query.user_id = filtros.user_id;
    }
    
    // Aplicar filtros de usuario según permisos
    query = addUserFilters(session || null, query);

    // Paginación
    const limite = filtros.limite || 20;
    const pagina = filtros.pagina || 1;
    const skip = (pagina - 1) * limite;

    // Ejecutar consultas en paralelo
    const [buffets, total] = await Promise.all([
      collection
        .find(query)
        .sort({ fechaCreacion: -1 })
        .skip(skip)
        .limit(limite)
        .toArray(),
      collection.countDocuments(query)
    ]);

    return {
      buffets,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite)
    };
  }

  // Obtener un buffet por ID
  static async obtenerBuffetPorId(
    id: string,
    session?: { user: { id: string; role: string } } | null
  ): Promise<Buffet | null> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      let query: Record<string, unknown> = { _id: objectId };
      
      // Aplicar filtros de usuario según permisos
      query = addUserFilters(session || null, query);
      
      return await collection.findOne(query as unknown as Filter<Buffet>);
    } catch {
      throw new Error('ID de buffet inválido');
    }
  }

  // Actualizar un buffet
  static async actualizarBuffet(
    id: string, 
    data: Partial<CrearBuffetData>,
    session?: { user: { id: string; role: string } } | null
  ): Promise<Buffet | null> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      let query: Record<string, unknown> = { _id: objectId };
      
      // Aplicar filtros de usuario según permisos
      query = addUserFilters(session || null, query);
      
      const datosActualizacion = {
        ...data,
        fechaActualizacion: new Date()
      };

      await collection.updateOne(
        query as unknown as Filter<Buffet>,
        { $set: datosActualizacion }
      );

      return await collection.findOne(query as unknown as Filter<Buffet>);
    } catch {
      throw new Error('ID de buffet inválido');
    }
  }

  // Eliminar un buffet
  static async eliminarBuffet(
    id: string,
    session?: { user: { id: string; role: string } } | null
  ): Promise<boolean> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      
      // Primero verificar si el buffet existe y el usuario tiene permisos para verlo
      let query: Record<string, unknown> = { _id: objectId };
      query = addUserFilters(session || null, query);
      
      const buffetToDelete = await collection.findOne(query as unknown as Filter<Buffet>);
      
      if (!buffetToDelete) {
        throw new Error('Buffet no encontrado o no tienes permisos para eliminarlo');
      }
      
      // Eliminar usando solo el ObjectId (sin filtros adicionales)
      const resultado = await collection.deleteOne({ _id: objectId } as unknown as Filter<Buffet>);
      
      return resultado.deletedCount === 1;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('ID de buffet inválido');
    }
  }
}

// Funciones exportadas para uso en las APIs
export const crearBuffet = BuffetsService.crearBuffet.bind(BuffetsService);
export const obtenerBuffets = BuffetsService.obtenerBuffets.bind(BuffetsService);
export const obtenerBuffetPorId = BuffetsService.obtenerBuffetPorId.bind(BuffetsService);
export const actualizarBuffet = BuffetsService.actualizarBuffet.bind(BuffetsService);
export const eliminarBuffet = BuffetsService.eliminarBuffet.bind(BuffetsService);