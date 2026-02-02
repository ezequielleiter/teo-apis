import { NextRequest, NextResponse } from 'next/server';
import { OrdenesService } from '@/lib/ordenes';
import { ProductosService } from '@/lib/productos';
import { PromosService } from '@/lib/promos';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const evento_id = searchParams.get('evento_id');

    if (!evento_id) {
      return NextResponse.json({ error: 'evento_id es requerido' }, { status: 400 });
    }

    // Obtener todas las órdenes del evento
    const ordenes = await OrdenesService.obtenerOrdenesPorEvento(evento_id);

    if (ordenes.length === 0) {
      return NextResponse.json({
        totalVendido: 0,
        totalTransferencia: 0,
        totalEfectivo: 0,
        cantidadOrdenes: 0,
        topProductos: [],
        topPromos: []
      });
    }

    let totalVendido = 0;
    let totalTransferencia = 0;
    let totalEfectivo = 0;
    const productosVendidos: Record<string, number> = {};
    const productosNombres: Record<string, string> = {};
    const promosVendidas: Record<string, number> = {};
    const promoNombres: Record<string, string> = {};

    for (const orden of ordenes) {
      totalVendido += orden.total;
      if (orden.forma_pago === 'transferencia') {
        totalTransferencia += orden.total;
      } else if (orden.forma_pago === 'efectivo') {
        totalEfectivo += orden.total;
      }
      console.log(orden);

      // Preferir usar productosExpandidos (contiene producto_id, nombre y origen)
      if (orden.productosExpandidos && orden.productosExpandidos.length > 0) {
        for (const p of orden.productosExpandidos) {
          const pid = p.producto_id;
          productosVendidos[pid] = (productosVendidos[pid] || 0) + p.cantidad;
          if (p.nombre) productosNombres[pid] = p.nombre;
          if (p.origen && p.origen.tipo === 'promo' && p.origen.id) {
            promoNombres[p.origen.id] = p.origen.nombre || promoNombres[p.origen.id] || '';
          }
        }
        // También contamos las promos tal como vienen en la orden (por si no hay productosExpandidos)
        for (const item of orden.productos) {
          if (item.tipo === 'promo') {
            promosVendidas[item.id] = (promosVendidas[item.id] || 0) + item.cantidad;
          }
        }
      } else {
        for (const item of orden.productos) {
          if (item.tipo === 'producto') {
            productosVendidos[item.id] = (productosVendidos[item.id] || 0) + item.cantidad;
          } else if (item.tipo === 'promo') {
            promosVendidas[item.id] = (promosVendidas[item.id] || 0) + item.cantidad;
          }
        }
      }
    }

    // Calcular top 3 productos
    const topProductos: Array<{ id: string; nombre: string | null; cantidad: number }> = [];
    if (Object.keys(productosVendidos).length > 0) {
      const productosOrdenados = Object.entries(productosVendidos)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      for (const [productoId, cantidad] of productosOrdenados) {
        try {
          const producto = await ProductosService.obtenerProductoPorId(productoId);
          topProductos.push({
            id: productoId,
            nombre: producto ? producto.nombre : productosNombres[productoId] || null,
            cantidad
          });
        } catch (e) {
          topProductos.push({ id: productoId, nombre: productosNombres[productoId] || null, cantidad });
        }
      }
    }

    // Calcular top 3 promos
    const topPromos: Array<{ id: string; nombre: string | null; cantidad: number }> = [];
    if (Object.keys(promosVendidas).length > 0) {
      const promosOrdenadas = Object.entries(promosVendidas)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      for (const [promoId, cantidad] of promosOrdenadas) {
        try {
          const promo = await PromosService.obtenerPromoPorId(promoId);
          topPromos.push({
            id: promoId,
            nombre: promo ? promo.nombre : promoNombres[promoId] || null,
            cantidad
          });
        } catch (e) {
          topPromos.push({ id: promoId, nombre: promoNombres[promoId] || null, cantidad });
        }
      }
    }

    return NextResponse.json({
      totalVendido,
      totalTransferencia,
      totalEfectivo,
      cantidadOrdenes: ordenes.length,
      topProductos,
      topPromos
    });
  } catch (error) {
    console.error('Error generando reporte:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}