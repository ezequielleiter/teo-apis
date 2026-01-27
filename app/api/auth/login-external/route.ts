import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/auth';
import { loginSchema } from '@/types/auth';
import { SignJWT } from 'jose';
import { BuffetsService } from '@/lib/buffets';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);
    // Find user
    const user = await UserService.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await UserService.verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Find buffet_id for admin users
    let buffet_id: string | undefined = undefined;
    if (user.role === 'admin') {
      console.log('Buscando buffet para usuario admin:', user._id);
      const buffets = await BuffetsService.obtenerBuffets({ user_id: user._id });
      console.log('Buffets encontrados:', buffets.buffets.length, buffets.buffets.map(b => ({ id: b._id, user_id: b.user_id })));
      buffet_id = buffets.buffets.length > 0 ? buffets.buffets[0]._id?.toString() : undefined;
      console.log('buffet_id asignado:', buffet_id);
    }

    // Create JWT token
    const token = await new SignJWT({
      id: user._id!,
      email: user.email,
      role: user.role,
      buffet_id: buffet_id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .setIssuedAt()
      .sign(secret);
    console.log("ACAAA");
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id!,
        email: user.email,
        role: user.role,
        buffet_id: buffet_id,
      },
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}