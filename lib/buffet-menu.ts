import { BuffetsService } from './buffets';
import { ProductosService } from './productos';
import { PromosService } from './promos';
import { Buffet } from '../types/buffets';
import { Producto } from '../types/productos';
import { PromoConDetalles } from '../types/promos';
import { EventosService } from './eventos';
import { Evento } from '@/types/eventos';
import { BannersService } from './banners';
import { Banner } from '@/types/banners';

export interface BuffetMenu {
  buffet: Buffet | null;
  productos: Producto[];
  promos: PromoConDetalles[];
  eventos: Evento[];
  banners: Banner[]
}

export class BuffetMenuService {
  static async obtenerMenuBuffet(buffetId: string): Promise<BuffetMenu> {
    
    const [buffet, productos, promosResult, eventos, banners] = await Promise.all([
      BuffetsService.obtenerBuffetPorIdPublic(buffetId),
      ProductosService.obtenerProductosPorBuffetPublic(buffetId),
      PromosService.obtenerPromosPublic({ buffet_id: buffetId }),
      EventosService.obtenerEventosPublic({buffet_id: buffetId}),
      BannersService.obtenerBannersPublic({buffet_id: buffetId})
    ]);

    return {
      buffet,
      productos,
      promos: promosResult.promos,
      eventos: eventos.eventos,
      banners: banners.banners
    };
  }
}

// Función exportada para uso en las APIs
export const obtenerMenuBuffet = BuffetMenuService.obtenerMenuBuffet.bind(BuffetMenuService);