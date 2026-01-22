import { ObjectId } from 'mongodb';
import { Incendio, CrearIncendioData, ActualizarIncendioData, EstadoIncendio } from '../types/incendios';
import { getCollection } from './helpers/mongo-helpers';
import { calcularAreaPoligonoHaversine } from './helpers/area-calculator';

export class IncendioService {

  static async crearIncendio(data: CrearIncendioData, creadoPor?: string): Promise<Incendio> {
    try {
      const collection = await getCollection("incendios")
      
      // Calcular área si se proporciona un polígono
      let areaMts: number | undefined;
      if (data.area && data.area.puntos && data.area.puntos.length >= 3) {
        areaMts = calcularAreaPoligonoHaversine(data.area.puntos);
      }
      
      const nuevoIncendio = {
        ...data,
        area_mts: areaMts,
        fecha_de_registro: new Date(),
        creado_por: creadoPor,
        actualizado_en: new Date()
      };

      const resultado = await collection.insertOne(nuevoIncendio);

      return {
        id: resultado.insertedId.toString(),
        ...nuevoIncendio,
        estado: nuevoIncendio.estado as EstadoIncendio
      };
    } catch (error) {
      console.error('Error al crear incendio:', error);
      throw new Error('Error al crear el incendio en la base de datos');
    }
  }

  static async obtenerIncendios(): Promise<Incendio[]> {
    try {
      const collection = await getCollection("incendios");
      
      const incendios = await collection
        .find({})
        .sort({ fecha_de_registro: -1 }) // Más recientes primero
        .toArray();

      return incendios.map(incendio => ({
        id: incendio._id.toString(),
        lugar: incendio.lugar,
        area: incendio.area,
        area_mts: incendio.area_mts,
        estado: incendio.estado,
        fecha_de_registro: incendio.fecha_de_registro,
        creado_por: incendio.creado_por,
        actualizado_en: incendio.actualizado_en
      }));
    } catch (error) {
      console.error('Error al obtener incendios:', error);
      throw new Error('Error al obtener los incendios de la base de datos');
    }
  }

  static async obtenerIncendioPorId(id: string): Promise<Incendio | null> {
    try {
      const collection = await getCollection("incendios");
      
      if (!ObjectId.isValid(id)) {
        return null;
      }

      const incendio = await collection.findOne({ _id: new ObjectId(id) });

      if (!incendio) {
        return null;
      }

      return {
        id: incendio._id.toString(),
        lugar: incendio.lugar,
        area: incendio.area,
        area_mts: incendio.area_mts,
        estado: incendio.estado,
        fecha_de_registro: incendio.fecha_de_registro,
        creado_por: incendio.creado_por,
        actualizado_en: incendio.actualizado_en
      };
    } catch (error) {
      console.error('Error al obtener incendio por ID:', error);
      throw new Error('Error al obtener el incendio de la base de datos');
    }
  }

  static async actualizarIncendio(id: string, data: ActualizarIncendioData): Promise<Incendio | null> {
    try {
      const collection = await getCollection("incendios");
      
      if (!ObjectId.isValid(id)) {
        return null;
      }

      // Calcular área si se proporciona un nuevo polígono
      let areaMts: number | undefined;
      if (data.area && data.area.puntos && data.area.puntos.length >= 3) {
        areaMts = calcularAreaPoligonoHaversine(data.area.puntos);
      }

      const datosActualizacion = {
        ...data,
        ...(areaMts !== undefined && { area_mts: areaMts }),
        actualizado_en: new Date()
      };

      const resultado = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: datosActualizacion },
        { returnDocument: 'after' }
      );

      if (!resultado) {
        return null;
      }

      return {
        id: resultado._id.toString(),
        lugar: resultado.lugar,
        area: resultado.area,
        area_mts: resultado.area_mts,
        estado: resultado.estado,
        fecha_de_registro: resultado.fecha_de_registro,
        creado_por: resultado.creado_por,
        actualizado_en: resultado.actualizado_en
      };
    } catch (error) {
      console.error('Error al actualizar incendio:', error);
      throw new Error('Error al actualizar el incendio en la base de datos');
    }
  }

  static async eliminarIncendio(id: string): Promise<boolean> {
    try {
      const collection = await getCollection("incendios");
      
      if (!ObjectId.isValid(id)) {
        return false;
      }

      const resultado = await collection.deleteOne({ _id: new ObjectId(id) });

      return resultado.deletedCount === 1;
    } catch (error) {
      console.error('Error al eliminar incendio:', error);
      throw new Error('Error al eliminar el incendio de la base de datos');
    }
  }

  static async obtenerIncendiosPorEstado(estado: EstadoIncendio): Promise<Incendio[]> {
    try {
      const collection = await getCollection("incendios");
      
      const incendios = await collection
        .find({ estado })
        .sort({ fecha_de_registro: -1 })
        .toArray();

      return incendios.map(incendio => ({
        id: incendio._id.toString(),
        lugar: incendio.lugar,
        area: incendio.area,
        area_mts: incendio.area_mts,
        estado: incendio.estado,
        fecha_de_registro: incendio.fecha_de_registro,
        creado_por: incendio.creado_por,
        actualizado_en: incendio.actualizado_en
      }));
    } catch (error) {
      console.error('Error al obtener incendios por estado:', error);
      throw new Error('Error al obtener los incendios por estado de la base de datos');
    }
  }

  static async obtenerIncendiosActivos(): Promise<Incendio[]> {
    return this.obtenerIncendiosPorEstado(EstadoIncendio.ACTIVO);
  }
}