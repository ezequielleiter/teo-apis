import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { User, UserRole } from '@/types/auth';
import { getCollection } from './helpers/mongo-helpers';

export class UserService {

  static async createUser(email: string, password: string, role: UserRole = UserRole.ADMIN, createdBy?: string, apis?: number): Promise<User | null> {
    try {
      const collection = await getCollection("users");
      
      // Check if user already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        throw new Error('Usuario ya existe');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = {
        email,
        password: hashedPassword,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(createdBy && { createdBy }),
        ...(apis !== undefined && { apis })
      };

      const result = await collection.insertOne(user);
      
      if (result.insertedId) {
        return { ...user, _id: result.insertedId.toString() };
      }
      
      return null;
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        throw new Error('Error de conexión a la base de datos');
      }
      throw error;
    }
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    try {
      const collection = await getCollection("users");
      const user = await collection.findOne({ email });
      
      if (user) {
        return { ...user, _id: user._id?.toString() } as User;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding user:', error);
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        console.error('MongoDB authentication failed');
      }
      return null;
    }
  }

  static async findUserById(id: string): Promise<User | null> {
    try {
      const collection = await getCollection("users");  
      const user = await collection.findOne({ _id: new ObjectId(id) });

      if (user) {
        return { ...user, _id: user._id?.toString() } as User;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  static async getAllUsers(): Promise<User[]> {
    try {
      const collection = await getCollection("users");
      const users = await collection.find({}).toArray();
      
      return users.map(user => ({
        ...user,
        _id: user._id?.toString()
      })) as User[];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  static async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const collection = await getCollection("users");
      
      // First, find the user and verify current password
      const user = await collection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            password: hashedNewPassword,
            updatedAt: new Date()
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  static async hasSuperAdmin(): Promise<boolean> {
    try {
      console.log("PASAA");
      const collection = await getCollection("users");
      console.log("AA", collection);
      
      const superAdminCount = await collection.countDocuments({ 
        role: UserRole.SUPERADMIN 
      });
      console.log(superAdminCount);
      
      return superAdminCount > 0;
    } catch (error) {
      console.error('Error checking for super admin:', error);
      return true; // Assume true to be safe if there's an error
    }
  }

  static async getUserCount(): Promise<number> {
    try {
      const collection = await getCollection("users");
      return await collection.countDocuments();
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  }
}