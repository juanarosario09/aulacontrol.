import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  Users,
  CalendarCheck,
  Percent,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Clock,
  PlusCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { calcularPorcentaje } from '@/lib/calculations';

export const metadata = {
  title: 'Dashboard | AulaControl',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role || 'TEACHER';

  // Obtener cursos / asignaciones del usuario (o todo si es ADMIN)
  let assignmentsWhere: any = {};
  if (role !== 'ADMIN' && userId) {
    assignmentsWhere = { userId };
  }

  const assignments = await prisma.teacherAssignment.findMany({
    where: assignmentsWhere,
    include: {
      section: {
        include: {
          course: true,
          enrollments: {
            where: {
              student: { isDeleted: false },
            },
            include: { student: true },
          },
        },
      },
      subject: true,
    },
  });

  const sectionIds = Array.from(new Set(assignments.map((a) => a.sectionId)));
  const uniqueStudentsMap = new Map<string, any>();
  assignments.forEach((a) => {
    a.section?.enrollments?.forEach((e) => {
      if (e.student && !uniqueStudentsMap.has(e.student.id)) {
        uniqueStudentsMap.set(e.student.id, e.student);
      }
    });
  });

  const totalStudents = uniqueStudentsMap.size;
  const totalCourses = new Set(assignments.map((a) => a.section?.courseId).filter(Boolean)).size;
  const totalSubjects = new Set(assignments.map((a) => a.subjectId).filter(Boolean)).size;

  // Clases recientes
  let sessionsWhere: any = {};
  if (role !== 'ADMIN' && userId) {
    sessionsWhere = { userId };
  }

  const recentSessions = await prisma.classSession.findMany({
    where: sessionsWhere,
    orderBy: { sessionDate: 'desc' },
    take: 5,
    include: {
      section: { include: { course: true } },
      subject: true,
      attendances: true,
    },
  });

  // Cálculo de promedio general rápido
  let totalPresentes = 0;
  let totalRegistros = 0;
  recentSessions.forEach((s) => {
    s.attendances.forEach((att) => {
      totalRegistros++;
      if (att.status === 'PRESENTE') totalPresentes++;
    });
  });

  const averageAttendance = totalRegistros > 0 ? Math.round((totalPresentes / totalRegistros) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Saludo y bienvenida */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            ¡Hola, {session?.user?.name || 'Docente'}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Resumen académico y control de asistencia — Período escolar República Dominicana
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/asistencia">
            <Button className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" />
              Tomar Asistencia Hoy
            </Button>
          </Link>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Estudiantes</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{totalStudents}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Asistencia Reciente</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">
              {totalRegistros > 0 ? `${averageAttendance}%` : '—'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Cursos / Grados</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{totalCourses}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Asignaturas Activas</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{totalSubjects}</p>
          </div>
        </div>
      </div>

      {/* Secciones principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de últimas sesiones de asistencia */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Últimas Clases Registradas"
            subtitle="Sesiones de asistencia pasadas recientemente"
            action={
              <Link href="/dashboard/asistencia/historial" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                Ver historial completo <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No hay clases registradas aún. ¡Comienza tomando la asistencia de hoy!
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentSessions.map((sessionItem) => {
                  const pCount = sessionItem.attendances.filter((a) => a.status === 'PRESENTE').length;
                  const total = sessionItem.attendances.length;
                  const pct = total > 0 ? Math.round((pCount / total) * 100) : 0;

                  return (
                    <div key={sessionItem.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {sessionItem.section?.course?.name || ''}
                          {sessionItem.section?.name || ''}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {sessionItem.subject?.name || 'Clase'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(sessionItem.sessionDate)} · {total} alumnos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-gray-900">{pct}%</span>
                        <p className="text-[11px] text-gray-400">{pCount}/{total} presentes</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Accesos rápidos e indicadores */}
        <div className="space-y-4">
          <Card title="Accesos Rápidos">
            <div className="space-y-2">
              <Link
                href="/dashboard/asistencia"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CalendarCheck className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Pasar Asistencia</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                href="/dashboard/asistencia/resumen-mensual"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Días Trabajados & Cálculo</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                href="/dashboard/estudiantes"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-700">Lista & Importar Excel</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                href="/dashboard/informes"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-gray-700">Descargar Informes (Excel/PDF)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </Card>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
            <span className="font-bold block mb-1">💡 Regla del Sistema:</span>
            El docente define manualmente los <strong>días trabajados del mes</strong> en el resumen mensual. Las excusas se registran como faltas justificadas que no penalizan tus derechos evaluativos.
          </div>
        </div>
      </div>
    </div>
  );
}
