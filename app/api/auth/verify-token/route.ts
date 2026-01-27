import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({
      user: {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      },
      valid: true
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Token inválido', valid: false },
      { status: 401 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Token requerido', valid: false },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({
      user: {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      },
      valid: true
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Token inválido', valid: false },
      { status: 401 }
    );
  }
}