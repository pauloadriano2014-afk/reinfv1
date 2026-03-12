import { parseStringPromise } from 'xml2js';

export type ParsedInvoice = {
  invoiceNumber: string;
  providerCnpj: string;
  issuerCnpj: string;
  serviceValue: number;
  retentionValue: number;
  serviceCode?: string;
};

export type ParsedReinfEvent = {
  eventType: string;
  cnpj: string;
  invoiceReference: string;
  serviceValue: number;
  retentionValue: number;
};

// Função para extrair o valor limpo (lida com os atributos criados pelo xml2js)
function extractValue(val: any): string {
  if (typeof val === 'object' && val !== null && val._) return String(val._);
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  return '';
}

// "Achatador" de objetos: Transforma um XML complexo num formato "Caminho = Valor"
function flattenObject(ob: any, prefix = ''): Record<string, string> {
  let toReturn: Record<string, string> = {};
  for (const i in ob) {
    if (!ob.hasOwnProperty(i)) continue;
    const val = ob[i];
    const newPrefix = prefix ? `${prefix}.${i}` : i;

    if (Array.isArray(val)) {
      if (typeof val[0] === 'object' && val[0] !== null && !val[0]._) {
        Object.assign(toReturn, flattenObject(val[0], newPrefix));
      } else {
        toReturn[newPrefix] = extractValue(val[0]);
      }
    } else if (typeof val === 'object' && val !== null && !val._) {
      Object.assign(toReturn, flattenObject(val, newPrefix));
    } else {
      toReturn[newPrefix] = extractValue(val);
    }
  }
  return toReturn;
}

// Limpa pontuações
function cleanCnpj(cnpj: string): string {
  if (!cnpj) return '';
  return cnpj.replace(/\D/g, '');
}

// Converte valores BR (1.000,50) ou US (1000.50) para Float
function parseBrazilianNumber(val: string): number {
  if (!val) return 0;
  if (val.includes('.') && !val.includes(',')) return parseFloat(val);
  const cleaned = val.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export async function parseNfseXml(xmlString: string): Promise<ParsedInvoice | null> {
  try {
    const result = await parseStringPromise(xmlString, { explicitArray: false });
    const flatMap = flattenObject(result);
    const keys = Object.keys(flatMap);

    // Busca inteligente usando Expressões Regulares
    const findVal = (regex: RegExp): string => {
      const matchedKey = keys.find(k => regex.test(k));
      return matchedKey ? flatMap[matchedKey] : '';
    };

    // Mapeamento flexível das tags (AGORA SUPORTA O PADRÃO NACIONAL SPED)
    const invoiceNumber = findVal(/\.(Numero|numeroNfse|nNF|nNFSe|NumeroNota|num_nota)$/i);
    
    // CNPJs (Padrão antigo e novo "emit" e "toma")
    let providerCnpj = findVal(/\.(prestador|emit|emitente).*\.(cnpj|cpf)$/i);
    if (!providerCnpj) providerCnpj = findVal(/\.cnpj$/i);

    const issuerCnpj = findVal(/\.(tomador|toma|destinatario).*\.(cnpj|cpf)$/i);

    // Valores (vServ é o padrão nacional novo)
    const serviceValueStr = findVal(/\.(ValorServicos|vlrServicos|vNF|ValorTotal|valor_servico|vServ|vBC)$/i);
    
    // Varredura de Retenções (Incluindo Padrão Nacional: vRetIRRF, vRetCSLL, vPis, vCofins)
    const inss = parseBrazilianNumber(findVal(/\.(ValorInss|vlrInss|vRetPrev|vRetINSS|vINSS)$/i));
    const ir = parseBrazilianNumber(findVal(/\.(ValorIr|vlrIR|vlrIrrf|vRetIRRF|vIRRF)$/i));
    const csll = parseBrazilianNumber(findVal(/\.(ValorCsll|vlrCSLL|vRetCSLL|vCSLL)$/i));
    const pis = parseBrazilianNumber(findVal(/\.(ValorPis|vlrPIS|vRetPis|vPis)$/i));
    const cofins = parseBrazilianNumber(findVal(/\.(ValorCofins|vlrCOFINS|vRetCofins|vCofins)$/i));
    const issRetido = parseBrazilianNumber(findVal(/\.(ValorIssRetido|vlrIssRet|vISSRet)$/i));
    const genRetencao = parseBrazilianNumber(findVal(/\.(ValorRetencao|vlrRetencao|val_retencao)$/i));

    // Soma tudo para mostrar a retenção total esperada
    let totalRetention = inss + ir + csll + pis + cofins + issRetido;
    if (totalRetention === 0 && genRetencao > 0) totalRetention = genRetencao;

    const serviceCode = findVal(/\.(ItemListaServico|codigoServico|cServ|cod_servico|cTribNac)$/i);

    // Se faltar o básico, rejeita
    if (!invoiceNumber || (!providerCnpj && !issuerCnpj) || !serviceValueStr) {
      console.warn('XML ignorado: Estrutura não reconhecida ou faltam dados obrigatórios.');
      return null;
    }

    return {
      invoiceNumber,
      providerCnpj: cleanCnpj(providerCnpj),
      issuerCnpj: cleanCnpj(issuerCnpj),
      serviceValue: parseBrazilianNumber(serviceValueStr),
      retentionValue: totalRetention,
      serviceCode: serviceCode || undefined,
    };
  } catch (error) {
    console.error('Erro ao fazer parse do XML da NFS-e:', error);
    return null;
  }
}

export async function parseReinfXml(xmlString: string): Promise<ParsedReinfEvent | null> {
  try {
    const result = await parseStringPromise(xmlString, { explicitArray: false });
    const flatMap = flattenObject(result);
    const keys = Object.keys(flatMap);

    const findVal = (regex: RegExp): string => {
      const matchedKey = keys.find(k => regex.test(k));
      return matchedKey ? flatMap[matchedKey] : '';
    };

    let eventType = 'R-2010'; 
    if (keys.some(k => k.includes('evtServPrest'))) eventType = 'R-2020';
    if (keys.some(k => k.includes('evtRetPJ'))) eventType = 'R-4020';

    const cnpj = findVal(/\.(nrInscPrest|nrInscTomador|cnpjBenef|cnpjPrestador)$/i);
    const invoiceReference = findVal(/\.(numDocto|numNF|nrDoc)$/i);
    const serviceValueStr = findVal(/\.(vlrBruto|vlrTotalBruto|vlrRendimento)$/i);
    
    const retencaoPrincipal = parseBrazilianNumber(findVal(/\.(vlrRetencao|vlrRetMv)$/i));
    const retencaoIR = parseBrazilianNumber(findVal(/\.(vlrIR)$/i));
    const retencaoAgregada = parseBrazilianNumber(findVal(/\.(vlrAgreg)$/i)); 
    
    const totalRetention = retencaoPrincipal + retencaoIR + retencaoAgregada;

    if (!cnpj || (!invoiceReference && eventType !== 'R-4020') || !serviceValueStr) {
      return null;
    }

    return {
      eventType,
      cnpj: cleanCnpj(cnpj),
      invoiceReference: invoiceReference || 'N/A',
      serviceValue: parseBrazilianNumber(serviceValueStr),
      retentionValue: totalRetention,
    };
  } catch (error) {
    console.error('Erro ao fazer parse do XML do REINF:', error);
    return null;
  }
}