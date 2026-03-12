'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Importado para gerenciar o estado ativo
import { 
  LayoutDashboard, 
  Building2, 
  CalendarDays, 
  UploadCloud, 
  AlertTriangle,
  Scale, 
  LogOut 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname(); // Identifica em qual página o usuário está

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-wider">
          Reinf<span className="text-purple-500">Check</span>
        </h1>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <Link 
          href="/" 
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
            pathname === '/' 
              ? 'bg-purple-600/10 text-purple-400 border-l-4 border-purple-500 rounded-l-none' 
              : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <LayoutDashboard size={20} className={pathname === '/' ? 'text-purple-500' : 'text-slate-400'} />
          <span className="font-medium">Dashboard</span>
        </Link>
        
        <Link 
          href="/company" 
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
            pathname === '/company' 
              ? 'bg-purple-600/10 text-purple-400 border-l-4 border-purple-500 rounded-l-none' 
              : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Building2 size={20} className={pathname === '/company' ? 'text-purple-500' : 'text-slate-400'} />
          <span className="font-medium">Empresas</span>
        </Link>
        
        <Link 
          href="/competence" 
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
            pathname === '/competence' 
              ? 'bg-purple-600/10 text-purple-400 border-l-4 border-purple-500 rounded-l-none' 
              : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <CalendarDays size={20} className={pathname === '/competence' ? 'text-purple-500' : 'text-slate-400'} />
          <span className="font-medium">Competências</span>
        </Link>

        <Link 
          href="/upload" 
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
            pathname === '/upload' 
              ? 'bg-purple-600/10 text-purple-400 border-l-4 border-purple-500 rounded-l-none' 
              : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <UploadCloud size={20} className={pathname === '/upload' ? 'text-purple-500' : 'text-slate-400'} />
          <span className="font-medium">Upload de Arquivos</span>
        </Link>

        {/* NOVO LINK: Regras Fiscais */}
        <Link 
          href="/rules" 
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
            pathname === '/rules' 
              ? 'bg-purple-600/10 text-purple-400 border-l-4 border-purple-500 rounded-l-none' 
              : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Scale size={20} className={pathname === '/rules' ? 'text-purple-500' : 'text-slate-400'} />
          <span className="font-medium">Regras Fiscais</span>
        </Link>

        <Link 
          href="/divergences" 
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
            pathname === '/divergences' 
              ? 'bg-purple-600/10 text-purple-400 border-l-4 border-purple-500 rounded-l-none' 
              : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <AlertTriangle size={20} className={pathname === '/divergences' ? 'text-purple-500' : 'text-slate-400'} />
          <span className="font-medium">Divergências</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-red-500/10 hover:text-red-500 transition-colors text-left group">
          <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}