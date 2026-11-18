import { PrismaClient } from '@prisma/client';

const NEON_DEFAULT_DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_ad5imgGtb0fA@ep-jolly-glade-bcc9vt5v-pooler.c-16.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = NEON_DEFAULT_DB_URL;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: NEON_DEFAULT_DB_URL,
      },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
