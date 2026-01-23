import { MongoClient, Db, Collection, ObjectId, Filter } from 'mongodb';
import clientPromise from './mongodb';
import { Evento, EventoConBuffet, CrearEventoData, FiltrarEventosData } from '../types/eventos';
import { BuffetsService } from './buffets';
import { addUserFilters } from './helpers/permissions';

export class EventosService {
  private static async getCollection(): Promise<Collection<Evento>> {
    const client: MongoClient = await clientPromise;
    const db: Db = client.db('teo-apis');
    return db.collection<Evento>('eventos');
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

  // Crear un nuevo evento
  static async crearEvento(
    data: CrearEventoData,
    session?: { user: { id: string; role: string } } | null
  ): Promise<EventoConBuffet> {
    // Validar que el buffet existe
    const buffetExiste = await this.validarBuffetExiste(data.buffet_id, session);
    if (!buffetExiste) {
      throw new Error('El buffet especificado no existe o no tienes permisos para acceder a él');
    }

    const collection = await this.getCollection();
    
    const nuevoEvento: Omit<Evento, '_id'> = {
      fecha: new Date(data.fecha),
      buffet_id: data.buffet_id,
      user_id: data.user_id,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    const resultado = await collection.insertOne(nuevoEvento as Evento);
    
    const eventoCreado = await collection.findOne({ _id: resultado.insertedId });
    
    if (!eventoCreado) {
      throw new Error('Error al crear el evento');
    }

    // Obtener datos del buffet para retornar evento completo
    const buffet = await BuffetsService.obtenerBuffetPorId(eventoCreado.buffet_id, session);
    
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
  static async obtenerEventos(
    filtros: FiltrarEventosData = {},
    session?: { user: { id: string; role: string } } | null
  ): Promise<{
    eventos: EventoConBuffet[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    const collection = await this.getCollection();
    
    // Construir query de MongoDB
    let query: Record<string, unknown> = {};
    
    if (filtros.buffet_id) {
      try {
        query.buffet_id = filtros.buffet_id;
      } catch {
        throw new Error('ID de buffet inválido');
      }
    }

    if (filtros.user_id) {
      query.user_id = filtros.user_id;
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

    // Aplicar filtros de usuario según permisos
    query = addUserFilters(session || null, query);

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
        const buffet = await BuffetsService.obtenerBuffetPorId(evento.buffet_id, session);
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
  static async obtenerEventoPorId(
    id: string,
    session?: { user: { id: string; role: string } } | null
  ): Promise<EventoConBuffet | null> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      let query: Record<string, unknown> = { _id: objectId };
      
      // Aplicar filtros de usuario según permisos
      query = addUserFilters(session || null, query);
      
      const evento = await collection.findOne(query as unknown as Filter<Evento>);
      
      if (!evento) {
        return null;
      }

      // Obtener datos del buffet
      const buffet = await BuffetsService.obtenerBuffetPorId(evento.buffet_id, session);
      
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
  static async actualizarEvento(
    id: string, 
    data: Partial<CrearEventoData>,
    session?: { user: { id: string; role: string } } | null
  ): Promise<EventoConBuffet | null> {
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
        fechaActualizacion: new Date()
      };

      if (data.fecha) {
        datosActualizacion.fecha = new Date(data.fecha);
      }
      if (data.buffet_id) {
        datosActualizacion.buffet_id = data.buffet_id;
      }
      if (data.user_id) {
        datosActualizacion.user_id = data.user_id;
      }

      await collection.updateOne(
        query as unknown as Filter<Evento>,
        { $set: datosActualizacion }
      );

      return await this.obtenerEventoPorId(id, session);
    } catch {
      throw new Error('ID de evento inválido');
    }
  }

  // Eliminar un evento
  static async eliminarEvento(
    id: string,
    session?: { user: { id: string; role: string } } | null
  ): Promise<boolean> {
    const collection = await this.getCollection();
    
    try {
      const objectId = new ObjectId(id);
      let query: Record<string, unknown> = { _id: objectId };
      
      // Aplicar filtros de usuario según permisos
      query = addUserFilters(session || null, query);
      
      const resultado = await collection.deleteOne(query as unknown as Filter<Evento>);
      return resultado.deletedCount === 1;
    } catch {
      throw new Error('ID de evento inválido');
    }
  }

  // Obtener eventos por buffet
  static async obtenerEventosPorBuffet(
    buffet_id: string,
    session?: { user: { id: string; role: string } } | null
  ): Promise<Evento[]> {
    const collection = await this.getCollection();
    
    let query: Record<string, unknown> = { buffet_id };
    
    // Aplicar filtros de usuario según permisos
    query = addUserFilters(session || null, query);
    
    return await collection
      .find(query)
      .sort({ fecha: 1 })
      .toArray();
  }
}

// Funciones exportadas para uso en las APIs
export const crearEvento = EventosService.crearEvento.bind(EventosService);
export const obtenerEventos = EventosService.obtenerEventos.bind(EventosService);
export const obtenerEventoPorId = EventosService.obtenerEventoPorId.bind(EventosService);
export const actualizarEvento = EventosService.actualizarEvento.bind(EventosService);
export const eliminarEvento = EventosService.eliminarEvento.bind(EventosService);