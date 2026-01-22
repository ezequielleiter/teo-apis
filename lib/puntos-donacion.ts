import { ObjectId } from 'mongodb';
import { getCollection } from './helpers/mongo-helpers';
import { 
  PuntoDonacion, 
  CrearPuntoDonacionData, 
  ActualizarPuntoDonacionData,
  FiltrarPuntosDonacionData 
} from '../types/puntos-donacion';

export class PuntosDonacionService {
  private static readonly COLLECTION_NAME = 'puntos-donacion';

  /**
   * Obtiene todos los puntos de donación con filtros opcionales
   */
  static async obtenerPuntos(filtros?: FiltrarPuntosDonacionData) {
    try {
      const collection = await getCollection(this.COLLECTION_NAME);

      // Construir query de filtros
      const query: Record<string, unknown> = {};
      
      if (filtros?.tipo_de_org) {
        query.tipo_de_org = filtros.tipo_de_org;
      }
      
      if (filtros?.insumos && filtros.insumos.length > 0) {
        query.insumos = { $in: filtros.insumos };
      }
      
      if (typeof filtros?.aprobado === 'boolean') {
        query.aprobado = filtros.aprobado;
      }

      // Paginación
      const limite = filtros?.limite || 50;
      const pagina = filtros?.pagina || 1;
      const saltar = (pagina - 1) * limite;

      const puntos = await collection
        .find(query)
        .sort({ fecha_de_registro: -1 })
        .skip(saltar)
        .limit(limite)
        .toArray();

      const total = await collection.countDocuments(query);

      return {
        puntos: puntos.map(punto => {
          const { _id, ...puntoParcial } = punto;
          return {
            ...puntoParcial,
            id: _id.toString()
          };
        }),
        total,
        pagina,
        total_paginas: Math.ceil(total / limite)
      };
    } catch (error) {
      console.error('Error al obtener puntos de donación:', error);
      throw new Error('Error interno del servidor');
    }
  }

  /**
   * Obtiene un punto de donación por su ID
   */
  static async obtenerPuntoPorId(id: string): Promise<PuntoDonacion | null> {
    try {
      if (!ObjectId.isValid(id)) {
        throw new Error('ID de punto de donación inválido');
      }

      const collection = await getCollection(this.COLLECTION_NAME);
      
      const punto = await collection.findOne({ _id: new ObjectId(id) });
      
      if (!punto) {
        return null;
      }

      const { _id, ...puntoParcial } = punto;
      return {
        ...puntoParcial,
        id: _id.toString()
      } as PuntoDonacion;
    } catch (error) {
      console.error('Error al obtener punto de donación:', error);
      throw new Error('Error interno del servidor');
    }
  }

  /**
   * Crea un nuevo punto de donación
   */
  static async crearPunto(datos: CrearPuntoDonacionData, creadoPor?: string): Promise<string> {
    try {
      const collection = await getCollection(this.COLLECTION_NAME);

      const nuevoPunto = {
        ...datos,
        fecha_de_registro: new Date(),
        creado_por: creadoPor,
        actualizado_en: new Date()
      };

      const resultado = await collection.insertOne(nuevoPunto);
      
      return resultado.insertedId.toString();
    } catch (error) {
      console.error('Error al crear punto de donación:', error);
      throw new Error('Error interno del servidor');
    }
  }

  /**
   * Actualiza un punto de donación existente
   */
  static async actualizarPunto(id: string, datos: ActualizarPuntoDonacionData): Promise<boolean> {
    try {
      if (!ObjectId.isValid(id)) {
        throw new Error('ID de punto de donación inválido');
      }

      const collection = await getCollection(this.COLLECTION_NAME);

      const datosActualizacion = {
        ...datos,
        actualizado_en: new Date()
      };

      const resultado = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: datosActualizacion }
      );

      return resultado.modifiedCount > 0;
    } catch (error) {
      console.error('Error al actualizar punto de donación:', error);
      throw new Error('Error interno del servidor');
    }
  }

  /**
   * Elimina un punto de donación
   */
  static async eliminarPunto(id: string): Promise<boolean> {
    try {
      if (!ObjectId.isValid(id)) {
        throw new Error('ID de punto de donación inválido');
      }

      const collection = await getCollection(this.COLLECTION_NAME);

      const resultado = await collection.deleteOne({ _id: new ObjectId(id) });
      
      return resultado.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar punto de donación:', error);
      throw new Error('Error interno del servidor');
    }
  }

  /**
   * Aprueba o desaprueba un punto de donación
   */
  static async cambiarAprobacion(id: string, aprobado: boolean): Promise<boolean> {
    try {
      if (!ObjectId.isValid(id)) {
        throw new Error('ID de punto de donación inválido');
      }

      const collection = await getCollection(this.COLLECTION_NAME);

      const resultado = await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            aprobado,
            actualizado_en: new Date()
          }
        }
      );

      return resultado.modifiedCount > 0;
    } catch (error) {
      console.error('Error al cambiar aprobación del punto:', error);
      throw new Error('Error interno del servidor');
    }
  }

  /**
   * Obtiene puntos de donación por proximidad geográfica
   */
  static async obtenerPuntosCercanos(lat: number, lng: number, radioKm: number = 10) {
    try {
      const collection = await getCollection(this.COLLECTION_NAME);

      // Convertir radio de km a radianes (para MongoDB geoNear)
      const radioEnRadianes = radioKm / 6371; // Radio de la Tierra en km

      const puntos = await collection.find({
        aprobado: true, // Solo mostrar puntos aprobados
        'lugar.coordenadas': {
          $geoWithin: {
            $centerSphere: [[lng, lat], radioEnRadianes]
          }
        }
      }).toArray();

      return puntos.map(punto => {
        const { _id, ...puntoParcial } = punto;
        return {
          ...puntoParcial,
          id: _id.toString()
        };
      });
    } catch (error) {
      console.error('Error al buscar puntos cercanos:', error);
      throw new Error('Error interno del servidor');
    }
  }
}