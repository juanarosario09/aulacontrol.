'use client';

import { Menu, School, Bell } from 'lucide-react';

interface HeaderProps {
  userName: string;
  onOpenSidebar: () => void;
}

export default function Header({ userName, onOpenSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <School className="w-5 h-5 text-blue-900" />
          <span className="font-bold text-gray-900">AulaControl</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-400 font-medium">Conectado como</p>
          <p className="text-sm font-semibold text-gray-800">{userName}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs ring-1 ring-blue-300">
          {userName ? userName.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
}
