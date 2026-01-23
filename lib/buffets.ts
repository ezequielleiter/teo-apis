import { MongoClient, Db, Collection, ObjectId, Filter } from 'mongodb';
import clientPromise from './mongodb';
import { Buffet, CrearBuffetData, FiltrarBuffetsData } from '../types/buffets';

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
  static async obtenerBuffets(filtros: FiltrarBuffetsData = {}): Promise<{
    buffets: Buffet[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    const collection = await this.getCollection();
    
    // Construir query de MongoDB
    const query: Record<string, unknown> = {};
    
    if (filtros.nombre) {
      query.nombre = { $regex: filtros.nombre, $options: 'i' };
    }
    
    if (filtros.lugar) {
      query.lugar = { $regex: filtros.lugar, $options: 'i' };
    }

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
  static async obtenerBuffetPorId(id: string): Promise<Buffet | null> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      return await collection.findOne({ _id: objectId } as unknown as Filter<Buffet>);
    } catch {
      throw new Error('ID de buffet inválido');
    }
  }

  // Actualizar un buffet
  static async actualizarBuffet(id: string, data: Partial<CrearBuffetData>): Promise<Buffet | null> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      const datosActualizacion = {
        ...data,
        fechaActualizacion: new Date()
      };

      await collection.updateOne(
        { _id: objectId } as unknown as Filter<Buffet>,
        { $set: datosActualizacion }
      );

      return await collection.findOne({ _id: objectId } as unknown as Filter<Buffet>);
    } catch {
      throw new Error('ID de buffet inválido');
    }
  }

  // Eliminar un buffet
  static async eliminarBuffet(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      const resultado = await collection.deleteOne({ _id: objectId } as unknown as Filter<Buffet>);
      return resultado.deletedCount === 1;
    } catch {
      throw new Error('ID de buffet inválido');
    }
  }
}