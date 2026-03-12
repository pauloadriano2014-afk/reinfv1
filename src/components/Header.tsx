'use client';

import { Bell, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="text-slate-500 font-medium">
        Bem-vindo ao validador EFD-Reinf
      </div>

      <div className="flex items-center gap-4">
        {/* Notificação com detalhe em Roxo */}
        <button className="text-slate-400 hover:text-purple-600 transition-colors relative p-1 rounded-full hover:bg-purple-50">
          <Bell size={20} />
          {/* Mudei a bolinha de red-500 para purple-500 conforme pedido */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          {/* Avatar do usuário em Roxo Premium */}
          <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold shadow-sm shadow-purple-50">
            <User size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800 leading-none">Adrielle</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Analista Fiscal</span>
          </div>
        </div>
      </div>
    </header>
  );
}