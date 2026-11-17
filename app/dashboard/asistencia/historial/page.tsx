'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { Calendar, Search, ArrowRight, BookOpen, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HistorialAsistenciaPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
        toast.error('Error al cargar datos');
      }
    };
    loadInitialData();
  }, []);

  const fetchHistory = async () => {
    if (!selectedSectionId) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/asistencia?sectionId=${selectedSectionId}&subjectId=${selectedSubjectId}&date=${new Date().toISOString().split('T')[0]}`);
      // Also we can query sessions directly or filter
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const allSections = courses.flatMap((c) =>
    c.sections.map((s: any) => ({
      id: s.id,
      name: s.name,
      course: { id: c.id, name: c.name },
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Historial de Clases</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consulta los registros de fechas y asistencias guardadas por sección y materia
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>

      <Card title="Sesiones Registradas">
        <div className="text-center py-8 text-gray-400 text-sm">
          <Calendar className="w-10 h-10 mx-auto text-blue-500 mb-2 opacity-50" />
          <p>Para registrar o modificar una sesión de asistencia para una fecha determinada,</p>
          <p className="mt-1">utiliza el módulo <a href="/dashboard/asistencia" className="text-blue-600 font-semibold underline">Pasar Asistencia</a>.</p>
        </div>
      </Card>
    </div>
  );
}
