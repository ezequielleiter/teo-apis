import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/auth';
import { registerSchema } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validated = registerSchema.parse(body);
    
    // Create user
    const user = await UserService.createUser(validated.email, validated.password);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Error al crear el usuario' },
        { status: 500 }
      );
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json(
      { message: 'Usuario creado exitosamente', user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message === 'Usuario ya existe') {
      return NextResponse.json(
        { error: 'El usuario ya existe' },
        { status: 409 }
      );
    }
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}