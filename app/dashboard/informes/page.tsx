'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { MESES_ANO_ESCOLAR } from '@/lib/calculations';
import { FileSpreadsheet, Printer, Download, BookOpen, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InformesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [downloading, setDownloading] = useState(false);

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

  const handleDownloadExcel = async () => {
    if (!selectedSectionId || !selectedSubjectId) {
      toast.error('Selecciona curso y asignatura');
      return;
    }

    try {
      setDownloading(true);
      const url = `/api/informes/excel?sectionId=${selectedSectionId}&subjectId=${selectedSubjectId}&month=${selectedMonth}&year=${selectedYear}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe_asistencia_${selectedMonth}_${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Descargando archivo Excel...');
    } catch {
      toast.error('Error al descargar');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
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
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Informes y Exportaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Genera sábanas de asistencia escolar en Excel y reportes oficiales listos para imprimir o PDF
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opción 1: Excel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Informe en Formato Excel (.xlsx)</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Descarga una hoja de cálculo completa con encabezados institucionales, total de días trabajados, desglose de Presentes, Ausentes, Tardanzas, Excusas y porcentajes individuales calculados.
              </p>
            </div>
          </div>
          <Button
            onClick={handleDownloadExcel}
            isLoading={downloading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Descargar Excel
          </Button>
        </div>

        {/* Opción 2: PDF / Imprimir */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Imprimir / Guardar como PDF</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Genera un informe limpio en formato imprimible apto para presentación a la dirección del centro educativo, coordinación pedagógica o archivo físico del aula.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={handlePrintPDF}
            className="w-full flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" /> Imprimir / Exportar a PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
