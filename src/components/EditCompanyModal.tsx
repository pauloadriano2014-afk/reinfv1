'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { maskCNPJ, unmask } from '@/utils/masks';

type Company = {
  id: string;
  name: string;
  cnpj: string;
};

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  company: Company | null;
}

export default function EditCompanyModal({ isOpen, onClose, onSave, company }: EditCompanyModalProps) {
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name);
      // Aplicamos a máscara ao carregar os dados para o formulário
      setCnpj(maskCNPJ(company.cnpj));
    }
  }, [company]);

  if (!isOpen) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Enviamos o CNPJ limpo para o banco de dados
        body: JSON.stringify({ name, cnpj: unmask(cnpj) }),
      });

      if (response.ok) {
        onSave();
        onClose();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erro ao atualizar empresa.');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">Editar Empresa</h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-purple-600 transition-colors p-1 rounded-full hover:bg-purple-50"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
            <input
              type="text"
              required
              value={cnpj}
              // Máscara aplicada em tempo real na edição
              onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all font-mono"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all shadow-md shadow-purple-100 disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}