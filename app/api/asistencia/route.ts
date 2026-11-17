import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get('sectionId');
  const subjectId = searchParams.get('subjectId');
  const dateStr = searchParams.get('date'); // YYYY-MM-DD

  if (!sectionId || !subjectId || !dateStr) {
    return NextResponse.json(
      { error: 'Faltan parámetros requeridos: sectionId, subjectId, date' },
      { status: 400 }
    );
  }

  try {
    const sessionDate = new Date(`${dateStr}T00:00:00.000Z`);

    const classSession = await prisma.classSession.findFirst({
      where: {
        sectionId,
        subjectId,
        sessionDate,
      },
      include: {
        attendances: true,
      },
    });

    return NextResponse.json({
      classSession,
      attendances: classSession ? classSession.attendances : [],
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
    const { sectionId, subjectId, dateStr, records } = await req.json();
    // records: Array<{ studentId: string; status: 'PRESENTE'|'AUSENTE'|'TARDANZA'|'EXCUSA'; note?: string }>

    if (!sectionId || !subjectId || !dateStr || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const sessionDate = new Date(`${dateStr}T00:00:00.000Z`);

    // Obtener escuela
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });

    if (!section) {
      return NextResponse.json({ error: 'Sección no encontrada' }, { status: 404 });
    }

    const schoolId = section.course.schoolId;

    // Obtener o crear la ClassSession para esa fecha
    let classSession = await prisma.classSession.findFirst({
      where: {
        sectionId,
        subjectId,
        sessionDate,
        userId,
      },
    });

    if (!classSession) {
      classSession = await prisma.classSession.create({
        data: {
          schoolId,
          userId,
          sectionId,
          subjectId,
          sessionDate,
        },
      });
    }

    // Upsert individual attendances in a transaction
    const upsertPromises = records.map((r: any) =>
      prisma.attendance.upsert({
        where: {
          studentId_classSessionId: {
            studentId: r.studentId,
            classSessionId: classSession!.id,
          },
        },
        create: {
          studentId: r.studentId,
          classSessionId: classSession!.id,
          status: r.status,
          note: r.note || null,
        },
        update: {
          status: r.status,
          note: r.note || null,
        },
      })
    );

    await prisma.$transaction(upsertPromises);

    return NextResponse.json({
      success: true,
      sessionId: classSession.id,
      count: records.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
