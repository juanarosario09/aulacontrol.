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
    // Si es ADMIN, trae todos los cursos. Si es TEACHER, trae cursos donde tiene asignaciones
    let courses;
    if (role === 'ADMIN') {
      courses = await prisma.course.findMany({
        include: {
          sections: {
            include: {
              enrollments: {
                where: { student: { isDeleted: false } },
                include: { student: true },
              },
              teacherAssignments: {
                include: { user: true, subject: true },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    } else {
      courses = await prisma.course.findMany({
        where: {
          sections: {
            some: {
              teacherAssignments: {
                some: { userId },
              },
            },
          },
        },
        include: {
          sections: {
            where: {
              teacherAssignments: {
                some: { userId },
              },
            },
            include: {
              enrollments: {
                where: { student: { isDeleted: false } },
                include: { student: true },
              },
              teacherAssignments: {
                where: { userId },
                include: { subject: true },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json(courses);
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
    const { name, level, schoolId: reqSchoolId } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    // Obtener o crear una escuela por defecto si no existe
    let school = await prisma.school.findFirst();
    if (!school) {
      school = await prisma.school.create({
        data: {
          name: 'Centro Educativo Principal',
        },
      });
    }

    const course = await prisma.course.create({
      data: {
        name,
        level,
        schoolId: reqSchoolId || school.id,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
