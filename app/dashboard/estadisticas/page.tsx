'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileCheck,
} from 'lucide-react';

export default function EstadisticasPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/cursos');
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Panel de Estadísticas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Seguimiento de asistencia por Año Escolar Dominicano (Agosto – Junio)
          </p>
        </div>
        <Badge variant="info" size="md">Año Escolar Activo: Ago - Jun</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Rango Favorable</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">90% – 100%</p>
          <p className="text-[11px] text-gray-400 mt-1">Excelente constancia escolar</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Seguimiento</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">80% – 89%</p>
          <p className="text-[11px] text-gray-400 mt-1">Alerta temprana preventiva</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Atención Prioritaria</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600 mt-2">&lt; 80%</p>
          <p className="text-[11px] text-gray-400 mt-1">Requiere contacto con el tutor</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Cálculo Acumulado</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-blue-900 mt-2">Ponderado</p>
          <p className="text-[11px] text-gray-400 mt-1">Total P / Total Trabajados</p>
        </div>
      </div>

      <Card
        title="Directrices de Evaluación y Asistencia (República Dominicana)"
        subtitle="Normativa del sistema escolar AulaControl"
      >
        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            • <strong>Cálculo Real:</strong> El porcentaje de asistencia de cada estudiante se calcula estrictamente dividiendo los días que estuvo físicamente presente entre el total de días trabajados que el docente determina para el mes.
          </p>
          <p>
            • <strong>Tardanzas:</strong> Se mantienen cuantificadas para control disciplinario, pero no se suman como asistencias completas en el numerador.
          </p>
          <p>
            • <strong>Excusas Médicas / Familiares:</strong> Son ausencias justificadas que amparan al estudiante para entrega de asignaciones pendientes y exámenes atrasados sin pérdida de derechos académicos.
          </p>
          <p>
            • <strong>Acumulado Anual:</strong> No se calcula haciendo promedio de los porcentajes mensuales (lo que distorsionaría meses con diferente número de días trabajados), sino sumando todos los días presentes del período escolar entre la suma total de días trabajados.
          </p>
        </div>
      </Card>
    </div>
  );
}
