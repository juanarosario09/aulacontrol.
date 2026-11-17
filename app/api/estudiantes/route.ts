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
  const role = (session.user as any).role;
  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get('sectionId');
  const query = searchParams.get('q');

  try {
    let whereClause: any = {
      isDeleted: false,
    };

    if (query) {
      whereClause.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { enrollmentCode: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (sectionId) {
      whereClause.enrollments = {
        some: { sectionId },
      };
    } else if (role !== 'ADMIN') {
      // Docente solo ve estudiantes de sus secciones asignadas
      whereClause.enrollments = {
        some: {
          section: {
            teacherAssignments: {
              some: { userId },
            },
          },
        },
      };
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        enrollments: {
          include: {
            section: {
              include: { course: true },
            },
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return NextResponse.json(students);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { firstName, lastName, enrollmentCode, sectionId, status = 'ACTIVE' } = await req.json();

    if (!firstName || !lastName || !sectionId) {
      return NextResponse.json(
        { error: 'Nombres, apellidos y sección son obligatorios' },
        { status: 400 }
      );
    }

    let school = await prisma.school.findFirst();
    if (!school) {
      school = await prisma.school.create({
        data: { name: 'Centro Educativo Principal' },
      });
    }

    // Comprobar si existe duplicado con mismo nombre completo en el centro
    const existing = await prisma.student.findFirst({
      where: {
        schoolId: school.id,
        isDeleted: false,
        firstName: { equals: firstName.trim(), mode: 'insensitive' },
        lastName: { equals: lastName.trim(), mode: 'insensitive' },
      },
    });

    const isDuplicate = !!existing;

    // Crear el estudiante con UUID auto-generado
    const student = await prisma.student.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        enrollmentCode: enrollmentCode ? enrollmentCode.trim() : null,
        status,
        schoolId: school.id,
        enrollments: {
          create: {
            sectionId,
          },
        },
      },
      include: {
        enrollments: {
          include: {
            section: { include: { course: true } },
          },
        },
      },
    });

    return NextResponse.json(
      {
        student,
        warning: isDuplicate
          ? 'Nota: Ya existía un estudiante con el mismo nombre y apellido en el centro.'
          : null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
