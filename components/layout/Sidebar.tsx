'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  BookOpen,
  BookmarkCheck,
  ClipboardList,
  Users,
  BarChart2,
  FileText,
  Settings,
  School,
  LogOut,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  userName: string;
  userRole: string;
  isOpen: boolean;
  onClose: () => void;
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/cursos', label: 'Mis Cursos', icon: BookOpen },
  { href: '/dashboard/asignaturas', label: 'Asignaturas', icon: BookmarkCheck },
  { href: '/dashboard/asistencia', label: 'Asistencia', icon: ClipboardList },
  { href: '/dashboard/estudiantes', label: 'Estudiantes', icon: Users },
  { href: '/dashboard/estadisticas', label: 'Estadísticas', icon: BarChart2 },
  { href: '/dashboard/informes', label: 'Informes', icon: FileText },
  { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
];

function roleLabel(role: string) {
  if (role === 'ADMIN') return 'Administrador';
  return 'Docente';
}

export default function Sidebar({ userName, userRole, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <div className="flex flex-col h-full bg-blue-900 text-white w-64 shadow-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-blue-800">
        <div className="bg-white rounded-lg p-1.5 shadow-sm">
          <School className="w-6 h-6 text-blue-900" />
        </div>
        <div>
          <span className="text-xl font-black tracking-tight block">AulaControl</span>
          <span className="text-[10px] text-blue-200 uppercase tracking-widest font-semibold block">Gestión Escolar</span>
        </div>
        {/* Mobile close button */}
        <button
          className="ml-auto lg:hidden text-blue-200 hover:text-white"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-800 text-white font-semibold shadow-inner'
                  : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info + sign out */}
      <div className="px-4 py-4 border-t border-blue-800 bg-blue-950/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center text-sm font-bold uppercase ring-2 ring-blue-500">
            {userName ? userName.charAt(0) : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{userName || 'Usuario'}</p>
            <p className="text-xs text-blue-300 font-medium">{roleLabel(userRole)}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-200 hover:text-white hover:bg-blue-800/80 rounded-lg transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex">{content}</div>
        </div>
      )}
    </>
  );
}
