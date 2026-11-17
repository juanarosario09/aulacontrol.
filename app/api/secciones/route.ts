import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { courseId, name } = await req.json();
    if (!courseId || !name) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const section = await prisma.section.create({
      data: {
        courseId,
        name,
      },
      include: {
        course: true,
      },
    });

    // Auto-asignar al docente creador si no existe asignatura asignada aún
    const school = await prisma.school.findFirst();
    let defaultSubject = await prisma.subject.findFirst();
    if (!defaultSubject && school) {
      defaultSubject = await prisma.subject.create({
        data: {
          name: 'General',
          schoolId: school.id,
        },
      });
    }

    if (defaultSubject && school) {
      await prisma.teacherAssignment.create({
        data: {
          userId,
          sectionId: section.id,
          subjectId: defaultSubject.id,
          schoolId: school.id,
        },
      });
    }

    return NextResponse.json(section, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
