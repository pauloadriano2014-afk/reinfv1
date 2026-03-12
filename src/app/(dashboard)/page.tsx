import prisma from '@/lib/prisma';
import { 
  Building2, 
  FileText, 
  AlertTriangle, 
  Clock, 
  ChevronRight, 
  CheckCircle,
  ArrowRightLeft
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [
    totalCompanies,
    totalInvoices,
    totalReinfEvents,
    totalDivergences,
    pendingCompanies
  ] = await Promise.all([
    prisma.company.count(),
    prisma.invoice.count(),
    prisma.reinfEvent.count(),
    prisma.divergence.count({ where: { resolved: false } }),
    prisma.company.findMany({
      where: {
        NOT: {
          competences: {
            some: { month: currentMonth, year: currentYear },
          },
        },
      },
      select: { id: true, name: true, cnpj: true },
      orderBy: { name: 'asc' },
    })
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Painel de Controle</h2>
          <p className="text-slate-500 mt-1">
            Status da consultoria para <span className="font-semibold text-purple-600">{currentMonth.toString().padStart(2, '0')}/{currentYear}</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Empresas</h3>
            <p className="text-2xl font-bold text-slate-900">{totalCompanies}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Notas Lidas</h3>
            <p className="text-2xl font-bold text-slate-900">{totalInvoices}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Eventos REINF</h3>
            <p className="text-2xl font-bold text-slate-900">{totalReinfEvents}</p>
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="bg-red-100 p-3 rounded-lg text-red-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-xs font-medium text-red-600 uppercase tracking-wider">Divergências</h3>
            <p className="text-2xl font-bold text-red-700">{totalDivergences}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock className="text-amber-500" /> Pendências de Fechamento
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {pendingCompanies.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <CheckCircle size={40} className="text-emerald-500" />
                <p className="font-bold text-slate-800">Tudo em dia!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingCompanies.map((company) => (
                  <div key={company.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{company.name}</p>
                      <p className="text-xs text-slate-500">{company.cnpj}</p>
                    </div>
                    <Link href="/upload" className="ml-4 text-purple-600 flex items-center gap-1 text-xs font-bold uppercase shrink-0 hover:underline">
                      Processar <ChevronRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Ações Rápidas</h3>
          <div className="flex flex-col gap-3">
            <Link href="/upload" className="p-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all flex items-center justify-between shadow-lg shadow-purple-100">
              Nova Validação <ChevronRight size={18} />
            </Link>
            <Link href="/divergences" className="p-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center justify-between">
              Analisar Divergências <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}