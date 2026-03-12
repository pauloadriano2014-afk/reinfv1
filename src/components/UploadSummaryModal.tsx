'use client';

import { X, CheckCircle2, AlertCircle, Building2, FileJson } from 'lucide-react';

interface SummaryData {
  processed: { company: string; invoices: number; events: number }[];
  errors: { file: string; reason: string }[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: SummaryData | null;
  divergences: number;
}

export default function UploadSummaryModal({ isOpen, onClose, data, divergences }: Props) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
        {/* Cabeçalho com fundo levemente roxo/slate */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Resumo do Processamento</h3>
            <p className="text-sm text-slate-500">Confira o que foi identificado nos arquivos</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-purple-600 transition-colors p-1 rounded-full hover:bg-purple-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {/* Alerta de Divergências - Mantemos o vermelho para erro, mas com estilo premium */}
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${divergences > 0 ? 'bg-red-50 border-red-100 text-red-800' : 'bg-purple-50 border-purple-100 text-purple-800'}`}>
            {divergences > 0 ? (
              <AlertCircle className="text-red-500 shrink-0" />
            ) : (
              <CheckCircle2 className="text-purple-500 shrink-0" />
            )}
            <span className="font-semibold">
              {divergences > 0 
                ? `Total de divergências encontradas: ${divergences}`
                : 'Nenhuma divergência detectada!'}
            </span>
          </div>

          {/* Empresas Processadas - Destaque em Roxo */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> Sucesso no Processamento
            </h4>
            <div className="space-y-2">
              {data.processed.length > 0 ? (
                data.processed.map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-purple-200 transition-colors shadow-sm gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <Building2 size={18} />
                      </div>
                      <span className="font-semibold text-slate-700">{item.company}</span>
                    </div>
                    <div className="flex gap-3 text-[10px] font-bold uppercase">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {item.invoices} NFSe
                      </span>
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                        {item.events} REINF
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic p-4 text-center bg-slate-50 rounded-lg">
                  Nenhum dado processado com sucesso.
                </p>
              )}
            </div>
          </div>

          {/* Falhas/Erros */}
          {data.errors.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" /> Pendências / Erros de Identificação
              </h4>
              <div className="space-y-2">
                {data.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-red-50/50 rounded-xl border border-red-100">
                    <FileJson size={18} className="text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{err.file}</p>
                      <p className="text-xs text-red-600">{err.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com botão roxo premium */}
        <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/30">
          <button 
            onClick={onClose} 
            className="px-8 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-md shadow-purple-100 active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}