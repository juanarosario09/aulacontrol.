import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calcularPorcentaje, calcularAcumulado } from '@/lib/calculations';

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
      { error: 'Faltan parámetros requeridos: sectionId, subjectId, month, year' },
      { status: 400 }
    );
  }

  try {
    // 1. Obtener días trabajados manuales introducidos por el docente
    const summaryRecord = await prisma.monthlyWorkSummary.findUnique({
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

    const workedDays = summaryRecord ? summaryRecord.workedDays : 0;

    // 2. Obtener sesiones de clase en el mes
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const sessions = await prisma.classSession.findMany({
      where: {
        sectionId,
        subjectId,
        userId,
        sessionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        attendances: true,
      },
    });

    const registeredDays = sessions.length;

    // 3. Obtener todos los estudiantes inscritos en la sección (activos e inactivos que no estén deleted)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sectionId,
        student: { isDeleted: false },
      },
      include: {
        student: true,
      },
      orderBy: [
        { student: { lastName: 'asc' } },
        { student: { firstName: 'asc' } },
      ],
    });

    // 4. Calcular asistencia por estudiante en este mes
    const studentsSummary = enrollments.map(({ student }) => {
      let presentes = 0;
      let ausentes = 0;
      let tardanzas = 0;
      let excusas = 0;

      sessions.forEach((s) => {
        const att = s.attendances.find((a) => a.studentId === student.id);
        if (att) {
          if (att.status === 'PRESENTE') presentes++;
          else if (att.status === 'AUSENTE') ausentes++;
          else if (att.status === 'TARDANZA') tardanzas++;
          else if (att.status === 'EXCUSA') excusas++;
        }
      });

      // REGLA CRÍTICA C-01: % = (Días Presentes / Días Trabajados) * 100
      const porcentaje = calcularPorcentaje(presentes, workedDays);

      return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        enrollmentCode: student.enrollmentCode,
        status: student.status,
        presentes,
        ausentes,
        tardanzas,
        excusas,
        diasTrabajados: workedDays,
        porcentaje,
      };
    });

    return NextResponse.json({
      month,
      year,
      workedDays,
      registeredDays,
      hasDiscrepancy: workedDays !== registeredDays,
      students: studentsSummary,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
