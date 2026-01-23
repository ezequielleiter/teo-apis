import clientPromise from "../mongodb";

export async function  getCollection(collection: string) {
    try {
      const client = await clientPromise;
      return client.db('teo-apis').collection(collection);
    } catch (error) {
      console.error('MongoDB connection error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Authentication failed')) {
          throw new Error('Credenciales de MongoDB incorrectas');
        }
        if (error.message.includes('Server selection timed out')) {
          throw new Error('No se puede conectar a MongoDB Atlas');
        }
      }
      throw new Error('Error de conexión a la base de datos');
    }
  }