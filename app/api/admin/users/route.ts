import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { UserService } from '@/lib/auth';
import { createUserSchema, UserRole } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener usuario actual
    const currentUser = await UserService.findUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Solo superadmin puede crear usuarios
    if (currentUser.role !== UserRole.SUPERADMIN) {
      return NextResponse.json(
        { error: 'Solo superadministradores pueden crear usuarios' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validar datos
    const validated = createUserSchema.parse(body);
    
    // Solo superadmin puede crear otros superadmin
    if (validated.role === UserRole.SUPERADMIN && currentUser.role !== UserRole.SUPERADMIN) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear superadministradores' },
        { status: 403 }
      );
    }
    
    // Crear usuario
    const user = await UserService.createUser(
      validated.email, 
      validated.password, 
      validated.role,
      currentUser._id,
      validated.apis
    );
    
    if (!user) {
      return NextResponse.json(
        { error: 'Error al crear el usuario' },
        { status: 500 }
      );
    }

    // Retornar usuario sin contraseña
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json(
      { 
        message: 'Usuario creado exitosamente', 
        user: userWithoutPassword 
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    
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
    // Verificar autenticación    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener usuario actual
    const currentUser = await UserService.findUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Solo superadmin puede ver todos los usuarios
    if (currentUser.role !== UserRole.SUPERADMIN) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver los usuarios' },
        { status: 403 }
      );
    }

    const users = await UserService.getAllUsers();
    
    // Retornar usuarios sin contraseñas
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
    
    return NextResponse.json({
      users: usersWithoutPasswords
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}