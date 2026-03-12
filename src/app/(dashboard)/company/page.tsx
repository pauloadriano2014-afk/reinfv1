'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Trash2, Pencil } from 'lucide-react';
import EditCompanyModal from '@/components/EditCompanyModal';

type Company = {
  id: string;
  cnpj: string;
  name: string;
};

export default function CompanyPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para o Modal de Edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, cnpj }),
      });

      if (response.ok) {
        setName('');
        setCnpj('');
        fetchCompanies();
      } else {
        alert('Erro ao cadastrar empresa. Verifique se o CNPJ já existe.');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      const response = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchCompanies();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao excluir empresa.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="text-blue-500" />
            Empresas
          </h2>
          <p className="text-slate-500 mt-1">Gerencie as empresas para validação do REINF.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Cadastrar Nova Empresa</h3>
        
        <form onSubmit={handleSubmit} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social / Nome</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Minha Empresa LTDA"
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ (Apenas números)</label>
            <input
              type="text"
              required
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 00000000000100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Plus size={20} />
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-sm font-medium text-slate-500">Razão Social</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-500">CNPJ</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                  Nenhuma empresa cadastrada ainda.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-800 font-medium">{company.name}</td>
                  <td className="px-6 py-4 text-slate-600">{company.cnpj}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => openEditModal(company)}
                      className="text-blue-500 hover:text-blue-700 p-2 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(company.id)}
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
      <EditCompanyModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={fetchCompanies}
        company={selectedCompany}
      />
    </div>
  );
}