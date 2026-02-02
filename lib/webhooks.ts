import { OrdenConDetalles, EstadoOrden } from '../types/ordenes';

interface WebhookPayload {
  event: 'order.created' | 'order.updated';
  timestamp: string;
  data: {
    order: OrdenConDetalles;
    previous_state?: EstadoOrden;
  };
}

interface WebhookConfig {
  url: string;
  secret?: string;
  timeout?: number;
  retries?: number;
}

export class WebhookService {
  private static readonly DEFAULT_TIMEOUT = 5000; // 5 segundos
  private static readonly DEFAULT_RETRIES = 2;

  /**
   * Envía webhook de orden creada
   */
  static async sendOrderCreatedWebhook(order: OrdenConDetalles): Promise<void> {
    const payload: WebhookPayload = {
      event: 'order.created',
      timestamp: new Date().toISOString(),
      data: { order }
    };

    await this.sendWebhook(payload);
  }

  /**
   * Envía webhook de orden actualizada
   */
  static async sendOrderUpdatedWebhook(
    order: OrdenConDetalles,
    previousState?: EstadoOrden
  ): Promise<void> {
    const payload: WebhookPayload = {
      event: 'order.updated',
      timestamp: new Date().toISOString(),
      data: { 
        order,
        previous_state: previousState
      }
    };

    await this.sendWebhook(payload);
  }

  /**
   * Envía webhook a todas las URLs configuradas
   */
  private static async sendWebhook(payload: WebhookPayload): Promise<void> {
    const webhookUrls = this.getWebhookUrls();
    
    if (webhookUrls.length === 0) {
      return;
    }

    const webhookPromises = webhookUrls.map(async (config) => {
      try {
        await this.deliverWebhook(config, payload);
      } catch (error) {
        console.error(`Failed to deliver webhook to ${config.url}:`, error);
        // No lanzar error para no interrumpir el flujo de órdenes
      }
    });

    // Ejecutar todos los webhooks en paralelo
    await Promise.allSettled(webhookPromises);
  }

  /**
   * Entrega webhook a una URL específica con reintentos
   */
  private static async deliverWebhook(
    config: WebhookConfig,
    payload: WebhookPayload
  ): Promise<void> {
    const maxRetries = config.retries ?? this.DEFAULT_RETRIES;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Teo-APIs-Webhook/1.0',
            ...(config.secret && {
              'X-Webhook-Signature': this.generateSignature(payload, config.secret)
            })
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(config.timeout ?? this.DEFAULT_TIMEOUT)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return; // Éxito
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Esperar antes del siguiente intento (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Genera firma HMAC para validación de webhook
   */
  private static generateSignature(payload: WebhookPayload, secret: string): string {
    const crypto = require('crypto');
    const body = JSON.stringify(payload);
    return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
  }

  /**
   * Obtiene URLs de webhook desde variables de entorno
   */
  private static getWebhookUrls(): WebhookConfig[] {
    const webhookUrls = process.env.WEBHOOK_URLS;
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (!webhookUrls) {
      return [];
    }

    try {
      // Soportar múltiples URLs separadas por comas
      const urls = webhookUrls.split(',').map(url => url.trim()).filter(Boolean);
      
      return urls.map(url => ({
        url,
        secret: webhookSecret,
        timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '5000'),
        retries: parseInt(process.env.WEBHOOK_RETRIES || '2')
      }));
    } catch (error) {
      console.error('Error parsing webhook URLs:', error);
      return [];
    }
  }
}

// Funciones de conveniencia exportadas
export const sendOrderCreatedWebhook = WebhookService.sendOrderCreatedWebhook.bind(WebhookService);
export const sendOrderUpdatedWebhook = WebhookService.sendOrderUpdatedWebhook.bind(WebhookService);