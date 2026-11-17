import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        enrollments: {
          include: {
            section: { include: { course: true } },
          },
        },
        attendances: {
          include: {
            classSession: {
              include: {
                subject: true,
                section: { include: { course: true } },
              },
            },
          },
          orderBy: { classSession: { sessionDate: 'desc' } },
        },
        observations: {
          include: { user: true, subject: true },
          orderBy: { observationDate: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { firstName, lastName, enrollmentCode, status, newSectionId } = await req.json();

    const updated = await prisma.student.update({
      where: { id: params.id },
      data: {
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
        ...(enrollmentCode !== undefined && { enrollmentCode: enrollmentCode ? enrollmentCode.trim() : null }),
        ...(status && { status }),
      },
    });

    // TRASLADO DE SECCIÓN (REGLA I-04):
    // Si se envía una nueva sección, creamos la nueva inscripción o actualizamos la actual,
    // preservando todos los registros históricos en la base de datos intactos.
    if (newSectionId) {
      await prisma.enrollment.upsert({
        where: {
          studentId_sectionId: {
            studentId: params.id,
            sectionId: newSectionId,
          },
        },
        create: {
          studentId: params.id,
          sectionId: newSectionId,
        },
        update: {
          leftAt: null,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // ELIMINACIÓN MANUAL CONFIRMADA POR EL DOCENTE (REGLA I-02):
    // Soft delete para que no se pierdan los registros históricos de asistencia
    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: 'Estudiante eliminado de la lista activa' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
