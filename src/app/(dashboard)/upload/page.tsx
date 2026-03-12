'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, FileType, AlertCircle, CheckCircle2, Zap, Settings2 } from 'lucide-react';
import UploadSummaryModal from '@/components/UploadSummaryModal';

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
};

export default function UploadPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [filteredCompetences, setFilteredCompetences] = useState<Competence[]>([]);
  
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [foundDivergences, setFoundDivergences] = useState(0);

  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedCompetence, setSelectedCompetence] = useState('');
  
  const [nfseFiles, setNfseFiles] = useState<File[]>([]);
  const [reinfFiles, setReinfFiles] = useState<File[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // ESTADOS DA NOVA ANIMAÇÃO DE LOADING
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    "Iniciando leitura dos arquivos...",
    "Extraindo CNPJs e valores das notas...",
    "Consultando o Cérebro Tributário...",
    "Calculando retenções de INSS e Federais...",
    "Gerando relatório de auditoria..."
  ];

  useEffect(() => {
    fetchCompanies();
    fetchCompetences();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      const filtered = competences.filter(c => c.companyId === selectedCompany);
      setFilteredCompetences(filtered);
      setSelectedCompetence('');
    } else {
      setFilteredCompetences([]);
    }
  }, [selectedCompany, competences]);

  // Efeito para ciclar as mensagens de loading enquanto faz o upload
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUploading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 1200); // Muda a mensagem a cada 1.2 segundos para dar sensação de progresso
    }
    return () => clearInterval(interval);
  }, [isUploading]);

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

  const handleNfseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setNfseFiles(Array.from(e.target.files));
  };

  const handleReinfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setReinfFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (nfseFiles.length === 0 && reinfFiles.length === 0) {
      setUploadStatus('error');
      setStatusMessage('Por favor, selecione os arquivos para upload.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setStatusMessage('');

    const formData = new FormData();
    
    if (!isBulkMode) {
      formData.append('companyId', selectedCompany);
      formData.append('competenceId', selectedCompetence);
    }
    
    nfseFiles.forEach((file) => formData.append('nfse', file));
    reinfFiles.forEach((file) => formData.append('reinf', file));

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        setSummaryData(data.summary);
        setFoundDivergences(data.divergencesFound);
        
        // Pequeno delay para a última mensagem de sucesso aparecer antes do modal
        setTimeout(() => {
          setShowSummary(true);
          setUploadStatus('success');
          setStatusMessage(`Processamento concluído com sucesso!`);
          setNfseFiles([]);
          setReinfFiles([]);
          setIsUploading(false);
        }, 800);
      } else {
        const errorData = await response.json();
        setUploadStatus('error');
        setStatusMessage(errorData.error || 'Erro ao processar arquivos.');
        setIsUploading(false);
      }
    } catch (error) {
      setUploadStatus('error');
      setStatusMessage('Erro de conexão ao enviar os arquivos.');
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-0 relative">
      
      {/* CORTINA DE LOADING PREMIUM */}
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 animate-in zoom-in duration-300">
            {/* Spinner Personalizado */}
            <div className="relative flex items-center justify-center w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-purple-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
              <UploadCloud className="text-purple-600 absolute animate-pulse" size={28} />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">Auditoria em Andamento</h3>
            
            <p className="text-sm font-medium text-purple-600 text-center h-5 transition-all">
              {loadingMessages[loadingStep]}
            </p>
            
            {/* Barra de Progresso */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-6">
              <div 
                className="bg-purple-600 h-full transition-all duration-500 ease-out"
                style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UploadCloud className="text-purple-600" />
            Upload e Validação
          </h2>
          <p className="text-slate-500 mt-1">Envie os XMLs das Notas e os eventos do REINF.</p>
        </div>

        <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsBulkMode(false)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${!isBulkMode ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Settings2 size={16} /> Modo Manual
          </button>
          <button
            type="button"
            onClick={() => setIsBulkMode(true)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${isBulkMode ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Zap size={16} /> Super Upload
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {!isBulkMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">1. Selecione a Empresa</label>
                <select
                  required
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="" disabled>Escolha uma empresa...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name} ({company.cnpj})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">2. Selecione a Competência</label>
                <select
                  required
                  disabled={!selectedCompany || filteredCompetences.length === 0}
                  value={selectedCompetence}
                  onChange={(e) => setSelectedCompetence(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="" disabled>
                    {!selectedCompany ? 'Selecione a empresa primeiro...' : filteredCompetences.length === 0 ? 'Nenhuma competência cadastrada' : 'Escolha o mês/ano...'}
                  </option>
                  {filteredCompetences.map((comp) => (
                    <option key={comp.id} value={comp.id}>{comp.month.toString().padStart(2, '0')}/{comp.year}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2">
              <Zap className="text-purple-500" />
              <div>
                <p className="text-sm font-semibold text-purple-800">Super Upload Ativado!</p>
                <p className="text-xs text-purple-700">O sistema identificará a empresa e competência automaticamente através do CNPJ em cada XML.</p>
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
              <input type="file" multiple accept=".xml" onChange={handleNfseChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <FileType className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-sm font-medium text-slate-900">XMLs das Notas (NFS-e)</h3>
              <p className="text-xs text-slate-500 mt-1">Arraste os arquivos aqui</p>
              {nfseFiles.length > 0 && (
                <div className="mt-3 text-sm font-medium text-purple-600 bg-purple-50 py-1 px-3 rounded-full inline-block">
                  {nfseFiles.length} arquivo(s)
                </div>
              )}
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
              <input type="file" multiple accept=".xml,.json" onChange={handleReinfChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <FileType className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-sm font-medium text-slate-900">Eventos EFD-Reinf</h3>
              <p className="text-xs text-slate-500 mt-1">Arraste os arquivos aqui</p>
              {reinfFiles.length > 0 && (
                <div className="mt-3 text-sm font-medium text-emerald-600 bg-emerald-50 py-1 px-3 rounded-full inline-block">
                  {reinfFiles.length} arquivo(s)
                </div>
              )}
            </div>
          </div>

          {uploadStatus !== 'idle' && (
            <div className={`p-4 border rounded-md flex items-center gap-3 text-sm ${uploadStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-purple-50 border-purple-200 text-purple-700'}`}>
              {uploadStatus === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              <p>{statusMessage}</p>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isUploading || (!isBulkMode && (!selectedCompany || !selectedCompetence)) || (nfseFiles.length === 0 && reinfFiles.length === 0)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-md font-medium flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-purple-100 active:scale-95"
            >
              <UploadCloud size={20} />
              Iniciar Validação Cruzada
            </button>
          </div>
        </form>
      </div>

      <UploadSummaryModal 
        isOpen={showSummary} 
        onClose={() => setShowSummary(false)} 
        data={summaryData} 
        divergences={foundDivergences}
      />
    </div>
  );
}