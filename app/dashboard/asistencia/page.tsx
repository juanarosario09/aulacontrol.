'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Calendar,
  CheckCircle,
  Save,
  Search,
  CheckCheck,
  Clock,
  FileText,
  AlertCircle,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AsistenciaDiariaPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<Record<string, { status: string; note: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Cargar cursos y asignaturas del docente
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

  // Cargar estudiantes y asistencias cuando cambie sección, asignatura o fecha
  useEffect(() => {
    if (!selectedSectionId || !selectedSubjectId || !selectedDate) return;

    const loadSession = async () => {
      try {
        setLoading(true);
        // 1. Obtener lista de estudiantes de la sección
        const estRes = await fetch(`/api/estudiantes?sectionId=${selectedSectionId}`);
        const estData = await estRes.json();
        setStudents(estData);

        // 2. Obtener asistencias guardadas si existen para esta fecha
        const attRes = await fetch(
          `/api/asistencia?sectionId=${selectedSectionId}&subjectId=${selectedSubjectId}&date=${selectedDate}`
        );
        const attData = await attRes.json();

        const initialRecords: Record<string, { status: string; note: string }> = {};

        // Mapear registros guardados o poner PRESENTE por defecto
        estData.forEach((st: any) => {
          const saved = attData.attendances?.find((a: any) => a.studentId === st.id);
          if (saved) {
            initialRecords[st.id] = { status: saved.status, note: saved.note || '' };
          } else {
            // Por defecto presente si es nueva sesión
            initialRecords[st.id] = { status: 'PRESENTE', note: '' };
          }
        });

        setRecords(initialRecords);
        setHasUnsavedChanges(false);
      } catch {
        toast.error('Error al cargar lista de asistencia');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [selectedSectionId, selectedSubjectId, selectedDate]);

  const handleStatusChange = (studentId: string, status: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: string; note: string }> = {};
    students.forEach((st) => {
      updated[st.id] = {
        ...records[st.id],
        status: 'PRESENTE',
      };
    });
    setRecords(updated);
    setHasUnsavedChanges(true);
    toast.success('Todos marcados como Presentes');
  };

  const handleSave = async () => {
    if (!selectedSectionId || !selectedSubjectId || !selectedDate) return;

    try {
      setSaving(true);
      const payload = {
        sectionId: selectedSectionId,
        subjectId: selectedSubjectId,
        dateStr: selectedDate,
        records: Object.entries(records).map(([studentId, data]) => ({
          studentId,
          status: data.status,
          note: data.note,
        })),
      };

      const res = await fetch('/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('¡Asistencia guardada exitosamente!');
        setHasUnsavedChanges(false);
      } else {
        toast.error('Error al guardar asistencia');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
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

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  // Conteo de estados
  const counts = {
    P: Object.values(records).filter((r) => r.status === 'PRESENTE').length,
    A: Object.values(records).filter((r) => r.status === 'AUSENTE').length,
    T: Object.values(records).filter((r) => r.status === 'TARDANZA').length,
    E: Object.values(records).filter((r) => r.status === 'EXCUSA').length,
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Registro Diario de Asistencia</h1>
          <p className="text-sm text-gray-500 mt-1">
            Marca presentes, ausentes, tardanzas y excusas con guardado seguro
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600 font-semibold flex items-center gap-1 animate-pulse">
              ● Cambios sin guardar
            </span>
          )}
          <Button onClick={handleSave} isLoading={saving} className="flex items-center gap-2">
            <Save className="w-4 h-4" /> Guardar Asistencia
          </Button>
        </div>
      </div>

      {/* Selectores de curso, asignatura y fecha */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
            Curso y Sección *
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
            Asignatura *
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
            Fecha de la Clase *
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Barra de acción rápida y conteo de estados */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleMarkAllPresent} className="flex items-center gap-1.5 text-xs font-semibold">
            <CheckCheck className="w-4 h-4 text-emerald-600" /> Marcar Todos Presentes
          </Button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar alumno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-300 w-44"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <strong>P:</strong> {counts.P} Presentes
          </span>
          <span className="flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
            <strong>A:</strong> {counts.A} Ausentes
          </span>
          <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <strong>T:</strong> {counts.T} Tardanzas
          </span>
          <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            <strong>E:</strong> {counts.E} Excusas
          </span>
        </div>
      </div>

      {/* Lista de estudiantes y botones P/A/T/E */}
      {loading ? (
        <Spinner size="lg" />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title="No hay estudiantes en esta sección"
          description="Inscribe estudiantes en esta sección o selecciona otro curso arriba."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredStudents.map((st, index) => {
              const currentStatus = records[st.id]?.status || 'PRESENTE';
              const isInactive = st.status === 'INACTIVE';

              return (
                <div
                  key={st.id}
                  className={`p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors ${
                    isInactive ? 'bg-amber-50/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-gray-400 font-mono w-6">{index + 1}.</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {st.lastName}, {st.firstName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {st.enrollmentCode && (
                          <span className="text-[11px] text-gray-500 font-mono">
                            {st.enrollmentCode}
                          </span>
                        )}
                        {isInactive && (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Inactivo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botones de estado P, A, T, E */}
                  <div className="flex items-center gap-1.5 sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(st.id, 'PRESENTE')}
                      className={`w-9 h-9 rounded-lg font-bold text-xs transition-all ${
                        currentStatus === 'PRESENTE'
                          ? 'bg-emerald-600 text-white shadow-md scale-105 ring-2 ring-emerald-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                      title="Presente"
                    >
                      P
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(st.id, 'AUSENTE')}
                      className={`w-9 h-9 rounded-lg font-bold text-xs transition-all ${
                        currentStatus === 'AUSENTE'
                          ? 'bg-red-600 text-white shadow-md scale-105 ring-2 ring-red-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700'
                      }`}
                      title="Ausente"
                    >
                      A
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(st.id, 'TARDANZA')}
                      className={`w-9 h-9 rounded-lg font-bold text-xs transition-all ${
                        currentStatus === 'TARDANZA'
                          ? 'bg-amber-500 text-white shadow-md scale-105 ring-2 ring-amber-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                      title="Tardanza (no suma a presentes)"
                    >
                      T
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(st.id, 'EXCUSA')}
                      className={`w-9 h-9 rounded-lg font-bold text-xs transition-all ${
                        currentStatus === 'EXCUSA'
                          ? 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                      title="Excusa (falta justificada - no suma a presentes)"
                    >
                      E
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Total en lista: <strong>{filteredStudents.length}</strong></span>
            <Button size="sm" onClick={handleSave} isLoading={saving} className="flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> Guardar Todo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
