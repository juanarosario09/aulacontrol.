import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { name, description, isArchived } = await req.json();
    const updated = await prisma.subject.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isArchived !== undefined && { isArchived }),
      },
    });

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
    // REGLA CRÍTICA I-03:
    // Verificar si la asignatura tiene sesiones de clase / asistencias registradas
    const countSessions = await prisma.classSession.count({
      where: { subjectId: params.id },
    });

    if (countSessions > 0) {
      return NextResponse.json(
        {
          error:
            'No se puede eliminar esta asignatura porque ya tiene asistencias o clases registradas. Puede archivarla para ocultarla sin perder el historial.',
          canArchive: true,
        },
        { status: 400 }
      );
    }

    // Si está en blanco (sin asistencias), proceder a borrar
    await prisma.teacherAssignment.deleteMany({
      where: { subjectId: params.id },
    });

    await prisma.subject.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Asignatura eliminada exitosamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
