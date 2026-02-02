import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema para validar configuración de webhook
const webhookConfigSchema = z.object({
  url: z.string().url('URL inválida'),
  secret: z.string().optional(),
  timeout: z.number().min(1000).max(30000).optional(), // 1s a 30s
  retries: z.number().min(0).max(5).optional() // 0 a 5 reintentos
});

const testWebhookSchema = z.object({
  url: z.string().url('URL inválida'),
  secret: z.string().optional()
});

// GET: Obtener configuración actual de webhooks
export async function GET() {
  try {
    const currentConfig = {
      urls: process.env.WEBHOOK_URLS ? process.env.WEBHOOK_URLS.split(',').map(u => u.trim()) : [],
      hasSecret: !!process.env.WEBHOOK_SECRET,
      timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '5000'),
      retries: parseInt(process.env.WEBHOOK_RETRIES || '2'),
      status: process.env.WEBHOOK_URLS ? 'configured' : 'not_configured'
    };

    return NextResponse.json(currentConfig);
  } catch (error) {
    console.error('Error obteniendo configuración de webhooks:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST: Probar webhook enviando evento de prueba
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, secret } = testWebhookSchema.parse(body);

    // Crear payload de prueba
    const testPayload = {
      event: 'order.test' as const,
      timestamp: new Date().toISOString(),
      data: {
        message: 'Este es un webhook de prueba desde Teo APIs',
        test: true
      }
    };

    // Generar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Teo-APIs-Webhook/1.0'
    };

    if (secret) {
      const crypto = require('crypto');
      const body = JSON.stringify(testPayload);
      const signature = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
      headers['X-Webhook-Signature'] = signature;
    }

    // Enviar webhook de prueba
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000) // 10 segundos para prueba
    });

    const responseData = {
      url,
      status: response.status,
      statusText: response.statusText,
      success: response.ok,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(response.headers.entries())
    };

    if (response.ok) {
      return NextResponse.json({
        message: 'Webhook de prueba enviado exitosamente',
        ...responseData
      });
    } else {
      return NextResponse.json({
        error: 'El webhook de prueba falló',
        ...responseData
      }, { status: 400 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Datos de entrada inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Error enviando webhook de prueba:', error);
    return NextResponse.json(
      { 
        error: 'Error enviando webhook de prueba',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// PUT: Documentación para configurar webhooks (solo información)
export async function PUT() {
  const documentation = {
    message: 'Los webhooks se configuran a través de variables de entorno',
    environment_variables: {
      WEBHOOK_URLS: {
        description: 'URLs de webhook separadas por comas',
        example: 'https://app1.example.com/webhook,https://app2.example.com/webhook',
        required: true
      },
      WEBHOOK_SECRET: {
        description: 'Secreto para firmar webhooks con HMAC SHA256',
        example: 'your-secret-key',
        required: false
      },
      WEBHOOK_TIMEOUT: {
        description: 'Timeout en milisegundos para cada webhook',
        example: '5000',
        default: '5000',
        required: false
      },
      WEBHOOK_RETRIES: {
        description: 'Número de reintentos en caso de fallo',
        example: '2',
        default: '2',
        required: false
      }
    },
    webhook_events: [
      {
        event: 'order.created',
        description: 'Se dispara cuando se crea una nueva orden',
        payload: {
          event: 'order.created',
          timestamp: '2026-02-02T10:00:00.000Z',
          data: {
            order: '{ /* OrdenConDetalles completa */ }'
          }
        }
      },
      {
        event: 'order.updated',
        description: 'Se dispara cuando se actualiza el estado de una orden',
        payload: {
          event: 'order.updated',
          timestamp: '2026-02-02T10:00:00.000Z',
          data: {
            order: '{ /* OrdenConDetalles completa */ }',
            previous_state: 'pendiente'
          }
        }
      }
    ],
    security: {
      signature_header: 'X-Webhook-Signature',
      signature_format: 'sha256=<hmac_hex>',
      verification: 'Calcular HMAC SHA256 del body JSON con el secret configurado'
    }
  };

  return NextResponse.json(documentation);
}