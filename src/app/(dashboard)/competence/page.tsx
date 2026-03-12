'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, Plus, Trash2, Pencil } from 'lucide-react';
import EditCompetenceModal from '@/components/EditCompetenceModal';

type Company = {
  id: string;
  name: string;
  cnpj: string;
};

type Competence = {
  id: string;
  month: number;
  year: number;
  companyId: string;
  company: Company;
};

export default function CompetencePage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);

  // Estados para o Modal de Edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCompetence, setCurrentCompetence] = useState<Competence | null>(null);

  useEffect(() => {
    fetchCompanies();
    fetchCompetences();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`/api/companies?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };

  const fetchCompetences = async () => {
    try {
      const response = await fetch('/api/competences');
      if (response.ok) {
        const data = await response.json();
        setCompetences(data);
      }
    } catch (error) {
      console.error('Erro ao buscar competências:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/competences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany,
          month: Number(month),
          year: Number(year),
        }),
      });

      if (response.ok) {
        setMonth('');
        fetchCompetences();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erro ao cadastrar competência.');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta competência? Todas as notas vinculadas serão afetadas.')) return;

    try {
      const response = await fetch(`/api/competences/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchCompetences();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao excluir competência.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (comp: Competence) => {
    setCurrentCompetence(comp);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="text-blue-500" />
            Competências
          </h2>
          <p className="text-slate-500 mt-1">Gerencie os períodos de apuração por empresa.</p>
        </div>
      </div>

      {/* Card do Formulário */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Nova Competência</h3>
        
        <form onSubmit={handleSubmit} className="flex items-end gap-4">
          <div className="flex-[2]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
            <select
              required
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="" disabled>Selecione uma empresa...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.cnpj})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Mês</label>
            <select
              required
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="" disabled>Mês</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
            <input
              type="number"
              required
              min="2020"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || companies.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Plus size={20} />
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>

      {/* Lista de Competências */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-sm font-medium text-slate-500">Empresa</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-500">Período (Mês/Ano)</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {competences.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                  Nenhuma competência cadastrada ainda.
                </td>
              </tr>
            ) : (
              competences.map((comp) => (
                <tr key={comp.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-800 font-medium">
                    {comp.company?.name || 'Empresa não encontrada'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {comp.month.toString().padStart(2, '0')}/{comp.year}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => openEditModal(comp)}
                      className="text-blue-500 hover:text-blue-700 p-2 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(comp.id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição */}
      <EditCompetenceModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={fetchCompetences}
        competence={currentCompetence}
      />
    </div>
  );
}