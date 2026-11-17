import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as ExcelJS from 'exceljs';
import { calcularPorcentaje, MESES_ANO_ESCOLAR } from '@/lib/calculations';

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
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
  }

  try {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: { include: { school: true } } },
    });
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!section || !subject) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

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

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const sessions = await prisma.classSession.findMany({
      where: {
        sectionId,
        subjectId,
        userId,
        sessionDate: { gte: startDate, lte: endDate },
      },
      include: { attendances: true },
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId, student: { isDeleted: false } },
      include: { student: true },
      orderBy: [{ student: { lastName: 'asc' } }, { student: { firstName: 'asc' } }],
    });

    const monthObj = MESES_ANO_ESCOLAR.find((m) => m.numero === month);
    const monthName = monthObj ? monthObj.nombre : `Mes ${month}`;

    // Construir Workbook con ExcelJS
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Resumen de Asistencia');

    // Títulos institucionales
    sheet.mergeCells('A1:H1');
    sheet.getCell('A1').value = section.course.school.name || 'AulaControl - Centro Educativo';
    sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Azul marino
    };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    sheet.mergeCells('A2:H2');
    sheet.getCell('A2').value = `INFORME MENSUAL DE ASISTENCIA ESCOLAR — ${monthName.toUpperCase()} ${year}`;
    sheet.getCell('A2').font = { size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
    sheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 24;

    // Metadatos
    sheet.getCell('A3').value = `Curso / Grado: ${section.course.name} - Sección ${section.name}`;
    sheet.getCell('A3').font = { bold: true, size: 10 };
    sheet.getCell('E3').value = `Asignatura: ${subject.name}`;
    sheet.getCell('E3').font = { bold: true, size: 10 };

    sheet.getCell('A4').value = `Docente: ${session.user.name || 'Docente'}`;
    sheet.getCell('A4').font = { size: 10 };
    sheet.getCell('E4').value = `Días Trabajados en el Mes: ${workedDays}`;
    sheet.getCell('E4').font = { bold: true, size: 10, color: { argb: 'FFB45309' } }; // Amber

    sheet.addRow([]); // Fila vacía

    // Cabecera de la tabla
    const headerRow = sheet.addRow([
      '#',
      'Apellidos y Nombres',
      'Matrícula',
      'Presentes (P)',
      'Ausentes (A)',
      'Tardanzas (T)',
      'Excusas (E)',
      '% Asistencia',
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 24;

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }, // Azul
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Filas de estudiantes
    enrollments.forEach(({ student }, index) => {
      let p = 0;
      let a = 0;
      let t = 0;
      let e = 0;

      sessions.forEach((s) => {
        const att = s.attendances.find((attItem) => attItem.studentId === student.id);
        if (att) {
          if (att.status === 'PRESENTE') p++;
          else if (att.status === 'AUSENTE') a++;
          else if (att.status === 'TARDANZA') t++;
          else if (att.status === 'EXCUSA') e++;
        }
      });

      const pct = calcularPorcentaje(p, workedDays);
      const row = sheet.addRow([
        index + 1,
        `${student.lastName}, ${student.firstName}`,
        student.enrollmentCode || '—',
        p,
        a,
        t,
        e,
        pct !== null ? `${pct}%` : '—',
      ]);

      row.height = 20;
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(3).alignment = { horizontal: 'center' };
      row.getCell(4).alignment = { horizontal: 'center' };
      row.getCell(5).alignment = { horizontal: 'center' };
      row.getCell(6).alignment = { horizontal: 'center' };
      row.getCell(7).alignment = { horizontal: 'center' };
      row.getCell(8).alignment = { horizontal: 'right' };
      row.getCell(8).font = { bold: true };

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
    });

    // Ajustar anchos de columnas
    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 34;
    sheet.getColumn(3).width = 16;
    sheet.getColumn(4).width = 14;
    sheet.getColumn(5).width = 14;
    sheet.getColumn(6).width = 14;
    sheet.getColumn(7).width = 14;
    sheet.getColumn(8).width = 16;

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="asistencia_${section.course.name}_sec${section.name}_${month}_${year}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
