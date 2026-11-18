import { AuthOptions, getServerSession as nextAuthGetServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

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
          throw new Error("Por favor ingresa tu email y contraseña");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Credenciales incorrectas");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Credenciales incorrectas");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as string,
        };
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
