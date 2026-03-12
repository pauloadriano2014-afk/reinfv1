'use client';

import { useState, useEffect } from 'react';
import { Scale, Plus, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

type TaxRule = {
  id: string;
  serviceCode: string;
  description: string;
  requireInss: boolean;
  requireFed: boolean;
  naturezaRendimento?: string;
};

export default function RulesPage() {
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [serviceCode, setServiceCode] = useState('');
  const [description, setDescription] = useState('');
  const [naturezaRendimento, setNaturezaRendimento] = useState('');
  const [requireInss, setRequireInss] = useState(false);
  const [requireFed, setRequireFed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Erro ao buscar regras:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceCode, description, requireInss, requireFed, naturezaRendimento }),
      });

      if (response.ok) {
        setServiceCode('');
        setDescription('');
        setNaturezaRendimento('');
        setRequireInss(false);
        setRequireFed(false);
        fetchRules();
      } else {
        alert('Erro ao cadastrar regra. Verifique se o código já existe.');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta regra fiscal?')) return;

    try {
      const response = await fetch(`/api/rules/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchRules();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Scale className="text-purple-600" />
            Regras Fiscais (Cérebro Tributário)
          </h2>
          <p className="text-slate-500 mt-1">Parametrize as retenções e a Natureza de Rendimento (Tabela 01 REINF).</p>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex gap-3 text-purple-800">
        <ShieldCheck className="shrink-0 mt-0.5 text-purple-600" />
        <div className="text-sm">
          <p className="font-bold mb-1">Como isso funciona?</p>
          <p>O sistema cruzará o código de serviço dos XMLs com as regras abaixo. Preencha a Natureza de Rendimento para que a auditoria entregue o código exato exigido pelo sistema Domínio.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Cadastrar Nova Regra</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Cód. Serviço</label>
              <input
                type="text"
                required
                value={serviceCode}
                onChange={(e) => setServiceCode(e.target.value)}
                placeholder="Ex: 07.02"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Execução por empreitada"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Natureza (Tab. 01)</label>
              <input
                type="text"
                value={naturezaRendimento}
                onChange={(e) => setNaturezaRendimento(e.target.value)}
                placeholder="Ex: 15001"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={requireInss} 
                onChange={(e) => setRequireInss(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-slate-300"
              />
              <div>
                <span className="block text-sm font-bold text-slate-700">Exige Retenção de INSS</span>
                <span className="block text-xs text-slate-500">Gera alerta para o R-2010/2020</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={requireFed} 
                onChange={(e) => setRequireFed(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-slate-300"
              />
              <div>
                <span className="block text-sm font-bold text-slate-700">Exige Impostos Federais</span>
                <span className="block text-xs text-slate-500">Gera alerta para o R-4020</span>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-100 disabled:opacity-50 w-full md:w-auto"
            >
              <Plus size={20} />
              {loading ? 'Salvando...' : 'Salvar Regra'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-sm font-medium text-slate-500">Código</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-500">Descrição</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-500 text-center">Natureza (Tab. 01)</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-500 text-center">Retém INSS?</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-500 text-center">Retém Fed.?</th>
              <th className="px-6 py-4 text-sm font-medium text-slate-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="text-slate-300" size={32} />
                    <p>Nenhuma regra cadastrada. O sistema fará apenas auditoria básica.</p>
                  </div>
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-purple-700 font-bold">{rule.serviceCode}</td>
                  <td className="px-6 py-4 text-slate-700 text-sm font-medium">{rule.description}</td>
                  <td className="px-6 py-4 text-center font-mono text-sm text-slate-600">
                    {rule.naturezaRendimento || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${rule.requireInss ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {rule.requireInss ? 'SIM' : 'NÃO'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${rule.requireFed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {rule.requireFed ? 'SIM' : 'NÃO'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(rule.id)}
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
    </div>
  );
}