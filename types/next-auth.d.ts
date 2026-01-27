import NextAuth from 'next-auth';
import { UserRole } from './auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      buffet_id?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    buffet_id?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    buffet_id?: string;
  }
}