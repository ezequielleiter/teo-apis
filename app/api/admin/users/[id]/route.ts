/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  role: 'admin' | 'superadmin';
  apis?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

async function getUsersCollection(): Promise<Collection<User>> {
  const client: MongoClient = await clientPromise;
  const db: Db = client.db('teo-apis');
  return db.collection<User>('users');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const collection = await getUsersCollection();
    const user = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // No devolver la contraseña
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error: any) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { email, role, password } = body;

    const collection = await getUsersCollection();
    
    // Verificar que el usuario existe
    const existingUser = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que el email no esté en uso por otro usuario
    if (email) {
      const emailExists = await collection.findOne({ 
        email, 
        _id: { $ne: new ObjectId(id) } 
      });
      if (emailExists) {
        return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 });
      }
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (email) updateData.email = email;
    if (role) updateData.role = role;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const updatedUser = await collection.findOne({ _id: new ObjectId(id) });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = updatedUser!;

    return NextResponse.json({ 
      user: userWithoutPassword,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error: any) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const collection = await getUsersCollection();
    
    // Verificar que el usuario existe y no es el propio usuario que hace la petición
    const userToDelete = await collection.findOne({ _id: new ObjectId(id) });
    if (!userToDelete) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (userToDelete._id?.toString() === session.user.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Usuario eliminado exitosamente' 
    });
  } catch (error: any) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}