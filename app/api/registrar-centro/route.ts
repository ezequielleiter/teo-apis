import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { nombre, apellido, ubicacion, email, telefono } = await request.json();

    // Validar campos requeridos
    if (!nombre || !apellido || !ubicacion || !email || !telefono) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Preparar el contenido del email
    const emailContent = `
NUEVO REGISTRO DE CENTRO

📋 DATOS DEL RESPONSABLE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre: ${nombre}
Apellido: ${apellido}
Email: ${email}
Teléfono: ${telefono}

📍 UBICACIÓN DEL CENTRO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${ubicacion}

📅 Fecha de registro: ${new Date().toLocaleString('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires'
})}

⚠️  ACCIÓN REQUERIDA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Por favor, contactar a la brevedad para coordinar:
1. Verificación del centro
2. Procedimientos necesarios

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sistema TEO APIs - Gestión de Registros
`;

    // En un entorno de producción, aquí usarías un servicio de email como SendGrid, Resend, etc.
    // Por ahora, simularemos el envío
    
    // Ejemplo con fetch a un servicio de email (debes configurar el endpoint real):
    /*
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TEO APIs <noreply@teo.org>',
        to: ['info@teocoop.site'],
        subject: 'Nuevo Centro Registrado',
        text: emailContent,
      }),
    });
    */

    // Por ahora, registramos en consola y devolvemos éxito

    return NextResponse.json(
      { 
        message: "Registro enviado exitosamente",
        data: { nombre, apellido, email, telefono, ubicacion }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error al procesar registro:', error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}