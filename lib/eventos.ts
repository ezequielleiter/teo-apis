import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import clientPromise from './mongodb';
import { Evento, EventoConBuffet, CrearEventoData, FiltrarEventosData } from '../types/eventos';
import { BuffetsService } from './buffets';

export class EventosService {
  private static async getCollection(): Promise<Collection<Evento>> {
    const client: MongoClient = await clientPromise;
    const db: Db = client.db('teo-apis');
    return db.collection<Evento>('eventos');
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

  // Crear un nuevo evento
  static async crearEvento(data: CrearEventoData): Promise<EventoConBuffet> {
    // Validar que el buffet existe
    const buffetExiste = await this.validarBuffetExiste(data.buffet_id);
    if (!buffetExiste) {
      throw new Error('El buffet especificado no existe');
    }

    const collection = await this.getCollection();
    
    const nuevoEvento: Omit<Evento, '_id'> = {
      fecha: new Date(data.fecha),
      buffet_id: data.buffet_id,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    const resultado = await collection.insertOne(nuevoEvento as Evento);
    
    const eventoCreado = await collection.findOne({ _id: resultado.insertedId });
    
    if (!eventoCreado) {
      throw new Error('Error al crear el evento');
    }

    // Obtener datos del buffet para retornar evento completo
    const buffet = await BuffetsService.obtenerBuffetPorId(eventoCreado.buffet_id);
    
    return {
      ...eventoCreado,
      buffet: buffet ? {
        _id: buffet._id!,
        nombre: buffet.nombre,
        lugar: buffet.lugar,
        descripcion: buffet.descripcion
      } : undefined
    };
  }

  // Obtener todos los eventos con filtros opcionales
  static async obtenerEventos(filtros: FiltrarEventosData = {}): Promise<{
    eventos: EventoConBuffet[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    const collection = await this.getCollection();
    
    // Construir query de MongoDB
    const query: Record<string, unknown> = {};
    
    if (filtros.buffet_id) {
      try {
        query.buffet_id = filtros.buffet_id;
      } catch {
        throw new Error('ID de buffet inválido');
      }
    }
    
    if (filtros.fecha_desde || filtros.fecha_hasta) {
      query.fecha = {} as Record<string, Date>;
      if (filtros.fecha_desde) {
        (query.fecha as Record<string, Date>).$gte = new Date(filtros.fecha_desde);
      }
      if (filtros.fecha_hasta) {
        (query.fecha as Record<string, Date>).$lte = new Date(filtros.fecha_hasta);
      }
    }

    // Paginación
    const limite = filtros.limite || 20;
    const pagina = filtros.pagina || 1;
    const skip = (pagina - 1) * limite;

    // Ejecutar consultas en paralelo
    const [eventos, total] = await Promise.all([
      collection
        .find(query)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limite)
        .toArray(),
      collection.countDocuments(query)
    ]);

    // Obtener datos de buffets para cada evento
    const eventosConBuffets: EventoConBuffet[] = await Promise.all(
      eventos.map(async (evento) => {
        const buffet = await BuffetsService.obtenerBuffetPorId(evento.buffet_id);
        return {
          ...evento,
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
      eventos: eventosConBuffets,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite)
    };
  }

  // Obtener un evento por ID
  static async obtenerEventoPorId(id: string): Promise<EventoConBuffet | null> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const evento = await collection.findOne({ _id: objectId } as any);
      
      if (!evento) {
        return null;
      }

      // Obtener datos del buffet
      const buffet = await BuffetsService.obtenerBuffetPorId(evento.buffet_id);
      
      return {
        ...evento,
        buffet: buffet ? {
          _id: buffet._id!,
          nombre: buffet.nombre,
          lugar: buffet.lugar,
          descripcion: buffet.descripcion
        } : undefined
      };
    } catch {
      throw new Error('ID de evento inválido');
    }
  }

  // Actualizar un evento
  static async actualizarEvento(id: string, data: Partial<CrearEventoData>): Promise<EventoConBuffet | null> {
    // Si se está actualizando el buffet_id, validar que existe
    if (data.buffet_id) {
      const buffetExiste = await this.validarBuffetExiste(data.buffet_id);
      if (!buffetExiste) {
        throw new Error('El buffet especificado no existe');
      }
    }

    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      const datosActualizacion: Record<string, unknown> = {
        fechaActualizacion: new Date()
      };

      if (data.fecha) {
        datosActualizacion.fecha = new Date(data.fecha);
      }
      if (data.buffet_id) {
        datosActualizacion.buffet_id = data.buffet_id;
      }

      await collection.updateOne(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { _id: objectId } as unknown as any,
        { $set: datosActualizacion }
      );

      return await this.obtenerEventoPorId(id);
    } catch {
      throw new Error('ID de evento inválido');
    }
  }

  // Eliminar un evento
  static async eliminarEvento(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultado = await collection.deleteOne({ _id: objectId } as any);
      return resultado.deletedCount === 1;
    } catch {
      throw new Error('ID de evento inválido');
    }
  }

  // Obtener eventos por buffet
  static async obtenerEventosPorBuffet(buffet_id: string): Promise<Evento[]> {
    const collection = await this.getCollection();
    
    return await collection
      .find({ buffet_id })
      .sort({ fecha: 1 })
      .toArray();
  }
}