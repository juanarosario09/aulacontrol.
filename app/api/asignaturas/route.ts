import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  try {
    let subjects;
    if (role === 'ADMIN') {
      subjects = await prisma.subject.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { classSessions: true },
          },
        },
      });
    } else {
      subjects = await prisma.subject.findMany({
        where: {
          teacherAssignments: {
            some: { userId },
          },
        },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { classSessions: true },
          },
        },
      });
    }

    return NextResponse.json(subjects);
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
    const { name, description } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    let school = await prisma.school.findFirst();
    if (!school) {
      school = await prisma.school.create({
        data: { name: 'Centro Educativo Principal' },
      });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        description,
        schoolId: school.id,
      },
    });

    // Asignar al docente a sus secciones existentes si las tiene
    const sections = await prisma.section.findMany({ take: 1 });
    if (sections.length > 0) {
      await prisma.teacherAssignment.upsert({
        where: {
          userId_sectionId_subjectId: {
            userId,
            sectionId: sections[0].id,
            subjectId: subject.id,
          },
        },
        create: {
          userId,
          sectionId: sections[0].id,
          subjectId: subject.id,
          schoolId: school.id,
        },
        update: {},
      });
    }

    return NextResponse.json(subject, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
