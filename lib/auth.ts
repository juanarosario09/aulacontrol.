import { AuthOptions, getServerSession as nextAuthGetServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

// Configuración automática de NEXTAUTH_URL y NEXTAUTH_SECRET en entornos Vercel
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = "aulacontrol_super_secret_jwt_key_2026_rd";
}

if (!process.env.NEXTAUTH_URL) {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const cleanEmail = credentials.email.trim();
          const user = await prisma.user.findFirst({
            where: { email: { equals: cleanEmail, mode: 'insensitive' } },
          });

          if (!user || !user.password) {
            console.error('[AUTH] Usuario no encontrado:', cleanEmail);
            return null;
          }

          let isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          // Si falla, probar quitando espacios en blanco accidentales (común en móviles o autocompletado)
          if (!isValid && credentials.password.trim() !== credentials.password) {
            isValid = await bcrypt.compare(
              credentials.password.trim(),
              user.password
            );
          }

          if (!isValid) {
            console.error('[AUTH] Contraseña no coincide para:', cleanEmail);
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as string,
          };
        } catch (err: any) {
          console.error('[AUTH_DB_ERROR]:', err?.message || err);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.name = user.name;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET || "aulacontrol_super_secret_jwt_key_2026_rd",
};

export async function getServerSession() {
  return await nextAuthGetServerSession(authOptions);
}

export async function requireAuth(role?: "ADMIN" | "TEACHER") {
  const session = await getServerSession();

  if (!session || !session.user) {
    redirect("/login");
  }

  if (role && (session.user as any).role !== role && (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  return session;
}
