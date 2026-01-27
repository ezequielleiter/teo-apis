import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { UserService } from '@/lib/auth';
import { loginSchema } from '@/types/auth';
import { BuffetsService } from '@/lib/buffets';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Validate input
          const validated = loginSchema.parse(credentials);

          // Find user
          const user = await UserService.findUserByEmail(validated.email);
          if (!user) {
            return null;
          }

          // Verify password
          const isValid = await UserService.verifyPassword(validated.password, user.password);
          if (!isValid) {
            return null;
          }

          // Find buffet_id for admin users
          let buffet_id: string | undefined = undefined;
          if (user.role === 'admin') {
            const buffets = await BuffetsService.obtenerBuffets({ user_id: user._id });
            buffet_id = buffets.buffets.length > 0 ? buffets.buffets[0]._id?.toString() : undefined;
          }

          return {
            id: user._id!,
            email: user.email,
            role: user.role,
            buffet_id: buffet_id,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/'
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.buffet_id = user.buffet_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.buffet_id = token.buffet_id as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
};