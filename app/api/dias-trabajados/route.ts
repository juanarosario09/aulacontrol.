import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get('sectionId');
  const subjectId = searchParams.get('subjectId');
  const month = parseInt(searchParams.get('month') || '0', 10);
  const year = parseInt(searchParams.get('year') || '0', 10);

  if (!sectionId || !subjectId || !month || !year) {
    return NextResponse.json(
      { error: 'Faltan parámetros: sectionId, subjectId, month, year' },
      { status: 400 }
    );
  }

  try {
    const summary = await prisma.monthlyWorkSummary.findUnique({
      where: {
        userId_sectionId_subjectId_month_year: {
          userId,
          sectionId,
          subjectId,
          month,
          year,
        },
      },
    });

    // Contar las sesiones registradas en ese mes para mostrar si hay diferencia
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const registeredDaysCount = await prisma.classSession.count({
      where: {
        sectionId,
        subjectId,
        userId,
        sessionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return NextResponse.json({
      workedDays: summary ? summary.workedDays : 0,
      registeredDays: registeredDaysCount,
      hasDiscrepancy: summary ? summary.workedDays !== registeredDaysCount : registeredDaysCount > 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { sectionId, subjectId, month, year, workedDays } = await req.json();

    if (!sectionId || !subjectId || !month || !year || workedDays === undefined) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const days = Math.max(0, parseInt(workedDays, 10));

    const summary = await prisma.monthlyWorkSummary.upsert({
      where: {
        userId_sectionId_subjectId_month_year: {
          userId,
          sectionId,
          subjectId,
          month: parseInt(month, 10),
          year: parseInt(year, 10),
        },
      },
      create: {
        userId,
        sectionId,
        subjectId,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        workedDays: days,
      },
      update: {
        workedDays: days,
      },
    });

    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
