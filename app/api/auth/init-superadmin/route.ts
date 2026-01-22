import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/auth';
import { createUserSchema, UserRole } from '@/types/auth';
// Clave de inicialización que debe ser proporcionada como variable de entorno
const INIT_KEY = process.env.SUPERADMIN_INIT_KEY;

export async function POST(request: NextRequest) {
  try {
    // Verificar que se haya configurado la clave de inicialización
    if (!INIT_KEY) {
      return NextResponse.json(
        { error: 'Sistema no configurado para inicialización' },
        { status: 500 }
      );
    }

    const hasSuperAdmin = await UserService.hasSuperAdmin();
    
    if (hasSuperAdmin) {
      return NextResponse.json(
        { error: 'Ya existe un superadministrador en el sistema' },
        { status: 409 }
      );
    }

    const body = await request.json();
    
    // Verificar la clave de inicialización
    if (!body.initKey || body.initKey !== INIT_KEY) {
      return NextResponse.json(
        { error: 'Clave de inicialización inválida' },
        { status: 403 }
      );
    }

    // Validar datos del usuario
    const validated = createUserSchema.parse({
      email: body.email,
      password: body.password,
      role: UserRole.SUPERADMIN
    });

    // Crear el primer superadministrador
    const user = await UserService.createUser(
      validated.email,
      validated.password,
      UserRole.SUPERADMIN,
      undefined, // No createdBy para el primer usuario
      undefined  // No apis limit para superadmin
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Error al crear el superadministrador' },
        { status: 500 }
      );
    }

    // Log de seguridad
    console.log(`[SECURITY] Primer superadministrador creado: ${validated.email} at ${new Date().toISOString()}`);

    // Retornar usuario sin contraseña
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: 'Superadministrador inicial creado exitosamente',
        user: userWithoutPassword
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating initial superadmin:', error);

    if (error instanceof Error && error.message === 'Usuario ya existe') {
      return NextResponse.json(
        { error: 'El usuario ya existe' },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: 'Validation failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Endpoint para verificar el estado de inicialización
    const hasSuperAdmin = await UserService.hasSuperAdmin();
    const userCount = await UserService.getUserCount();

    return NextResponse.json({
      initialized: hasSuperAdmin,
      userCount,
      needsInitialization: !hasSuperAdmin && userCount === 0
    });
  } catch (error) {
    console.error('Error checking initialization status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}