import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { Adapter } from 'next-auth/adapters';

// Extend the PrismaAdapter to include the role field
const adapter = PrismaAdapter(prisma) as Adapter;
const extendedAdapter: Adapter = {
  ...adapter,
  createUser: async (user) => {
    const createdUser = await prisma.user.create({
      data: {
        ...user,
        role: 'user',
      },
    });
    return {
      id: createdUser.id,
      email: createdUser.email!,
      emailVerified: createdUser.emailVerified ?? null,
      name: createdUser.name ?? null,
      image: createdUser.image ?? null,
      role: createdUser.role,
      nif: createdUser.nif ?? null,
    };
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: extendedAdapter,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/conta',
    signOut: '/conta',
    error: '/conta',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).trim();
        const password = credentials.password as string;

        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: email,
              mode: 'insensitive',
            },
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          nif: user.nif ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as string;
        token.nif = user.nif ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.nif = token.nif ?? null;
      }
      return session;
    },
  },
});
