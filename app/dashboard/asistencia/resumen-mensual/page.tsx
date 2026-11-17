'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { MESES_ANO_ESCOLAR, getEstadoAsistencia } from '@/lib/calculations';
import {
  Calendar,
  AlertTriangle,
  Save,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResumenMensualPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [workedDays, setWorkedDays] = useState<number>(0);
  const [registeredDays, setRegisteredDays] = useState<number>(0);
  const [hasDiscrepancy, setHasDiscrepancy] = useState<boolean>(false);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingDays, setSavingDays] = useState(false);

  // Cargar cursos y asignaturas
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch('/api/cursos'),
          fetch('/api/asignaturas'),
        ]);

        if (cRes.ok && sRes.ok) {
          const cData = await cRes.json();
          const sData = await sRes.json();
          setCourses(cData);
          setSubjects(sData.filter((s: any) => !s.isArchived));

          if (cData.length > 0 && cData[0].sections.length > 0) {
            setSelectedSectionId(cData[0].sections[0].id);
          }
          if (sData.length > 0) {
            setSelectedSubjectId(sData[0].id);
          }
        }
      } catch {
        toast.error('Error al cargar datos iniciales');
      }
    };
    loadInitialData();
  }, []);

  // Cargar resumen del mes
  const fetchMonthlySummary = async () => {
    if (!selectedSectionId || !selectedSubjectId) return;

    try {
      setLoading(true);
      const res = await fetch(
        `/api/asistencia/resumen?sectionId=${selectedSectionId}&subjectId=${selectedSubjectId}&month=${selectedMonth}&year=${selectedYear}`
      );

      if (res.ok) {
        const data = await res.json();
        setWorkedDays(data.workedDays || 0);
        setRegisteredDays(data.registeredDays || 0);
        setHasDiscrepancy(data.hasDiscrepancy);
        setStudents(data.students || []);
      }
    } catch {
      toast.error('Error al cargar resumen mensual');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlySummary();
  }, [selectedSectionId, selectedSubjectId, selectedMonth, selectedYear]);

  // Guardar días trabajados manuales
  const handleSaveWorkedDays = async () => {
    if (!selectedSectionId || !selectedSubjectId) return;

    try {
      setSavingDays(true);
      const res = await fetch('/api/dias-trabajados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selectedSectionId,
          subjectId: selectedSubjectId,
          month: selectedMonth,
          year: selectedYear,
          workedDays: workedDays,
        }),
      });

      if (res.ok) {
        toast.success('Días trabajados actualizados. Porcentajes recalculados.');
        fetchMonthlySummary();
      } else {
        toast.error('Error al guardar días trabajados');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSavingDays(false);
    }
  };

  // Secciones aplanadas
  const allSections = courses.flatMap((c) =>
    c.sections.map((s: any) => ({
      id: s.id,
      name: s.name,
      course: { id: c.id, name: c.name },
    }))
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Resumen Mensual y Días Trabajados
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fórmula oficial: % Asistencia = (Días Presentes / Días Trabajados) × 100
          </p>
        </div>
      </div>

      {/* Selectores */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
            Curso y Sección
          </label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {allSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.course.name} - Sección {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
            Asignatura
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
            Mes (Año Escolar RD)
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MESES_ANO_ESCOLAR.map((m) => (
              <option key={m.numero} value={m.numero}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
            Año
          </label>
          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Panel prioritario: Total de Días Trabajados en el Mes */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <span className="text-xs font-bold tracking-widest uppercase text-blue-300">
              Función Prioritaria del Sistema
            </span>
            <h2 className="text-xl font-bold">Total de Días Trabajados en el Mes</h2>
            <p className="text-xs text-blue-100 leading-relaxed">
              Introduce manualmente la cantidad real de días de clase impartidos. Este número será el denominador sobre el cual AulaControl calculará automáticamente el porcentaje sobre 100 para todos los estudiantes.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-200 mb-1">
                Días Trabajados
              </label>
              <input
                type="number"
                min="0"
                value={workedDays}
                onChange={(e) => setWorkedDays(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-24 px-3 py-2 text-center text-xl font-black text-gray-900 bg-white rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <Button
              onClick={handleSaveWorkedDays}
              isLoading={savingDays}
              variant="success"
              className="mt-5 text-xs font-bold shadow-md"
            >
              <Save className="w-4 h-4 mr-1.5" /> Aplicar y Recalcular
            </Button>
          </div>
        </div>

        {/* Advertencia si hay discrepancia entre días trabajados y registrados */}
        {hasDiscrepancy && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Aviso de discrepancia:</strong> Has establecido <strong>{workedDays}</strong> días trabajados como meta del mes, pero en el sistema se han registrado asistencias para <strong>{registeredDays}</strong> fechas de clase. Puedes revisar las fechas en la sección de historial.
            </p>
          </div>
        )}
      </div>

      {/* Tabla resumen calculada */}
      {loading ? (
        <Spinner size="lg" />
      ) : students.length === 0 ? (
        <EmptyState
          title="No hay estudiantes inscritos en esta sección"
          description="Agrega estudiantes en la sección correspondiente para ver el cálculo mensual."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-gray-600 font-semibold uppercase text-xs border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Estudiante</th>
                  <th className="px-4 py-3.5 text-center text-emerald-700 bg-emerald-50/50">
                    Presentes (P)
                  </th>
                  <th className="px-4 py-3.5 text-center text-red-700 bg-red-50/50">
                    Ausentes (A)
                  </th>
                  <th className="px-4 py-3.5 text-center text-amber-700 bg-amber-50/50">
                    Tardanzas (T)
                  </th>
                  <th className="px-4 py-3.5 text-center text-blue-700 bg-blue-50/50">
                    Excusas (E)
                  </th>
                  <th className="px-4 py-3.5 text-center">Días Meta</th>
                  <th className="px-5 py-3.5 text-right font-black">Porcentaje (%)</th>
                  <th className="px-5 py-3.5 text-right">Condición</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((st) => {
                  const est = getEstadoAsistencia(st.porcentaje);
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-gray-900">
                        {st.lastName}, {st.firstName}
                        {st.enrollmentCode && (
                          <span className="block text-[11px] text-gray-400 font-normal">
                            {st.enrollmentCode}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-emerald-700">
                        {st.presentes}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-red-700">
                        {st.ausentes}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-amber-600">
                        {st.tardanzas}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-blue-600">
                        {st.excusas}
                      </td>
                      <td className="px-4 py-3.5 text-center text-gray-600 font-mono">
                        {st.diasTrabajados}
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-base">
                        {st.porcentaje !== null ? (
                          <span
                            className={
                              st.porcentaje >= 90
                                ? 'text-emerald-600'
                                : st.porcentaje >= 80
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }
                          >
                            {st.porcentaje}%
                          </span>
                        ) : (
                          <span className="text-gray-300 font-normal text-xs">Sin meta</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Badge variant={est.color as any} size="sm">
                          {est.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
            <span>
              Mostrando {students.length} estudiantes · Días trabajados asignados:{' '}
              <strong>{workedDays}</strong>
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-emerald-700">● ≥90% Favorable</span>
              <span className="text-amber-700">● 80-89% Seguimiento</span>
              <span className="text-red-700">● &lt;80% Atención prioritaria</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
