'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, FileText, Building2, Download, Search, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { generateDivergencePDF } from '@/utils/reportGenerator';

type Company = {
  name: string;
  cnpj: string;
};

type Competence = {
  month: number;
  year: number;
  company: Company;
};

type Invoice = {
  invoiceNumber: string;
  providerCnpj: string;
  serviceValue: number;
};

type Divergence = {
  id: string;
  status: 'WARNING' | 'ERROR';
  errorMessage: string;
  expectedRetention: number | null;
  reportedRetention: number | null;
  resolved: boolean;
  invoice: Invoice | null;
  competence: Competence;
};

export default function DivergencesPage() {
  const [divergences, setDivergences] = useState<Divergence[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterCompany, setFilterCompany] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    fetchDivergences();
  }, []);

  const fetchDivergences = async () => {
    try {
      const response = await fetch('/api/divergences');
      if (response.ok) {
        const data = await response.json();
        setDivergences(data);
      }
    } catch (error) {
      console.error('Erro ao buscar divergências:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleResolved = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/divergences/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: !currentStatus }),
      });
      if (response.ok) {
        setDivergences(prev => prev.map(d => d.id === id ? { ...d, resolved: !currentStatus } : d));
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const filteredDivergences = divergences.filter((div) => {
    const matchesCompany = 
      div.competence.company.name.toLowerCase().includes(filterCompany.toLowerCase()) ||
      div.competence.company.cnpj.includes(filterCompany);
    
    const matchesMonth = filterMonth === '' || div.competence.month === Number(filterMonth);
    const matchesStatus = showResolved ? true : !div.resolved;

    return matchesCompany && matchesMonth && matchesStatus;
  });

  const handleDownloadReport = () => {
    if (filteredDivergences.length === 0) return;

    const firstComp = filteredDivergences[0].competence;
    const isSingleCompany = filteredDivergences.every(d => d.competence.company.name === firstComp.company.name);
    
    const companyLabel = isSingleCompany ? firstComp.company.name : "Relatório Consolidado";
    const competenceLabel = filterMonth !== '' 
      ? `${filterMonth.padStart(2, '0')}/${firstComp.year}` 
      : "Diversos Periodos";

    generateDivergencePDF(companyLabel, competenceLabel, filteredDivergences);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="text-purple-600" />
            Divergências Encontradas
          </h2>
          <p className="text-slate-500 mt-1">
            Analise e gerencie as inconsistências detectadas.
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          disabled={loading || filteredDivergences.length === 0}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
        >
          <Download size={18} />
          Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm items-center">
        <div className="relative col-span-1 md:col-span-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Filtrar Empresa..."
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
          >
            <option value="">Todos os meses</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>Mês {m.toString().padStart(2, '0')}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none ml-2">
          <input 
            type="checkbox" 
            checked={showResolved} 
            onChange={(e) => setShowResolved(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
          />
          <span className="text-sm text-slate-600 font-medium">Mostrar resolvidos</span>
        </label>
        
        <div className="text-sm text-slate-400 text-right">
          {filteredDivergences.length} registros
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando dados...</div>
        ) : filteredDivergences.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-800">Tudo limpo por aqui!</h3>
            <p className="text-slate-500 mt-1">Não há divergências pendentes com os filtros atuais.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-sm font-medium text-slate-500 w-10"></th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500">Status</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500">Empresa / Período</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500">Nota Fiscal</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500 text-right">Esperado</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-500 text-right">Informado</th>
                </tr>
              </thead>
              <tbody>
                {filteredDivergences.map((div) => (
                  <tr 
                    key={div.id} 
                    className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${div.resolved ? 'opacity-50 bg-slate-50/50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleResolved(div.id, div.resolved)}
                        className="text-slate-300 hover:text-purple-600 transition-colors outline-none"
                        title={div.resolved ? "Marcar como pendente" : "Marcar como resolvido"}
                      >
                        {div.resolved ? (
                          <CheckCircle2 className="text-emerald-500" size={22} />
                        ) : (
                          <Circle size={22} />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium ${
                        div.resolved 
                          ? 'bg-slate-200 text-slate-600' 
                          : div.status === 'ERROR' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {div.resolved ? 'RESOLVIDO' : div.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-slate-400" />
                        <div>
                          <p className={`text-sm font-medium ${div.resolved ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                            {div.competence.company.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {div.competence.month.toString().padStart(2, '0')}/{div.competence.year}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {div.invoice ? (
                        <div>
                          <p className="text-sm font-medium text-slate-800">Nº {div.invoice.invoiceNumber}</p>
                          <p className="text-xs text-slate-500">CNPJ: {div.invoice.providerCnpj}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-slate-800">
                        {formatCurrency(div.expectedRetention)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-medium ${div.resolved ? 'text-slate-500' : 'text-red-600'}`}>
                        {formatCurrency(div.reportedRetention)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}