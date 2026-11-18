import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasDbUrl = !!process.env.DATABASE_URL;
  const hasSecret = !!process.env.NEXTAUTH_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL || 'NO_DEFINIDO';
  const vercelUrl = process.env.VERCEL_URL || 'NO_DEFINIDO';

  let dbConnection = 'DESCONOCIDO';
  let adminCount = 0;
  let adminEmailFound = false;

  try {
    const admin = await prisma.user.findFirst({
      where: { email: { equals: 'juanarosario200018@gmail.com', mode: 'insensitive' } },
    });
    dbConnection = 'CONECTADO_EXITOSAMENTE';
    adminEmailFound = !!admin;
    adminCount = await prisma.user.count();
  } catch (err: any) {
    dbConnection = `ERROR_CONEXION: ${err?.message || err}`;
  }

  return NextResponse.json({
    status: 'ok',
    hasDatabaseUrl: hasDbUrl,
    hasSecret: hasSecret,
    nextAuthUrl,
    vercelUrl,
    databaseStatus: dbConnection,
    adminEmailFound,
    totalUsuariosEnBd: adminCount,
  });
}
