import { BuffetsService } from './buffets';
import { ProductosService } from './productos';
import { PromosService } from './promos';
import { Buffet } from '../types/buffets';
import { Producto } from '../types/productos';
import { PromoConDetalles } from '../types/promos';

export interface BuffetMenu {
  buffet: Buffet | null;
  productos: Producto[];
  promos: PromoConDetalles[];
}

export class BuffetMenuService {
  static async obtenerMenuBuffet(buffetId: string): Promise<BuffetMenu> {
    
    const [buffet, productos, promosResult] = await Promise.all([
      BuffetsService.obtenerBuffetPorIdPublic(buffetId),
      ProductosService.obtenerProductosPorBuffetPublic(buffetId),
      PromosService.obtenerPromosPublic({ buffet_id: buffetId }) // Sin sesión, obtener todas las promos del buffet
    ]);

    return {
      buffet,
      productos,
      promos: promosResult.promos
    };
  }
}

// Función exportada para uso en las APIs
export const obtenerMenuBuffet = BuffetMenuService.obtenerMenuBuffet.bind(BuffetMenuService);