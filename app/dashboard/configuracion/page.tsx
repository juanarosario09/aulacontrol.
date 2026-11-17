'use client';

import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { User, School, Shield, Calendar, Database } from 'lucide-react';

export default function ConfiguracionPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Configuración del Sistema</h1>
        <p className="text-sm text-gray-500 mt-1">
          Parámetros de tu cuenta y del período lectivo activo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Perfil del Usuario" subtitle="Información de acceso">
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                {session?.user?.name ? session.user.name.charAt(0) : 'U'}
              </div>
              <div>
                <p className="font-bold text-gray-900">{session?.user?.name || 'Docente'}</p>
                <p className="text-xs text-gray-500">{session?.user?.email || '—'}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Rol en el sistema:</span>
                <span className="font-semibold text-gray-800">
                  {(session?.user as any)?.role === 'ADMIN' ? 'Administrador General' : 'Docente'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Privacidad:</span>
                <span className="font-semibold text-gray-800">Datos privados y aislados</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Configuración Escolar" subtitle="Calendario oficial">
          <div className="space-y-3 text-xs text-gray-600">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 text-blue-900 font-medium">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>Año escolar: <strong>Agosto a Junio (República Dominicana)</strong></span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 text-emerald-900 font-medium">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>Fórmula: <strong>(Presentes / Días Trabajados) × 100</strong></span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-50 text-purple-900 font-medium">
              <Database className="w-4 h-4 text-purple-700" />
              <span>Base de Datos: <strong>Neon PostgreSQL Cloud (Serverless)</strong></span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
