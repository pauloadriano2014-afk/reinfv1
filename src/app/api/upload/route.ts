import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseNfseXml, parseReinfXml } from '@/utils/parser';
import { runValidationEngine, ValidationInvoice, ValidationReinfEvent } from '@/utils/validation';
import { findOrCreateTarget } from '@/utils/upload-helper';

interface UploadMemoryInvoice extends ValidationInvoice {
  inssRetention: number;
  fedRetention: number;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const manualCompanyId = formData.get('companyId') as string;
    const manualCompetenceId = formData.get('competenceId') as string;

    const nfseFiles = formData.getAll('nfse') as File[];
    const reinfFiles = formData.getAll('reinf') as File[];

    if (nfseFiles.length === 0 && reinfFiles.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const taxRules = await prisma.taxRule.findMany();
    const rulesMap = new Map(taxRules.map(r => [r.serviceCode, r]));

    const summary = {
      processed: {} as Record<string, { company: string; invoices: number; events: number }>,
      errors: [] as { file: string; reason: string }[]
    };

    const invoicesByCompetence: Record<string, UploadMemoryInvoice[]> = {};
    const eventsByCompetence: Record<string, ValidationReinfEvent[]> = {};
    const processedCompetences = new Set<string>();

    for (const file of nfseFiles) {
      try {
        const xmlString = await file.text();
        const parsedData = await parseNfseXml(xmlString);

        if (parsedData) {
          const target = await findOrCreateTarget(
            parsedData.issuerCnpj, 
            undefined, 
            manualCompanyId, 
            manualCompetenceId
          );

          if (target) {
            const invoice = await prisma.invoice.create({
              data: {
                invoiceNumber: parsedData.invoiceNumber,
                issuerCnpj: parsedData.issuerCnpj,
                providerCnpj: parsedData.providerCnpj,
                serviceCode: parsedData.serviceCode,
                serviceValue: parsedData.serviceValue,
                retentionValue: parsedData.retentionValue,
                competenceId: target.competenceId,
              }
            });

            if (!summary.processed[target.competenceId]) {
              const comp = await prisma.competence.findUnique({ 
                where: { id: target.competenceId }, 
                include: { company: true } 
              });
              summary.processed[target.competenceId] = { 
                company: comp?.company.name || 'Desconhecida', 
                invoices: 0, 
                events: 0 
              };
            }
            summary.processed[target.competenceId].invoices++;

            if (!invoicesByCompetence[target.competenceId]) invoicesByCompetence[target.competenceId] = [];
            invoicesByCompetence[target.competenceId].push({
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              providerCnpj: invoice.providerCnpj,
              retentionValue: invoice.retentionValue,
              serviceCode: invoice.serviceCode || undefined,
              inssRetention: parsedData.inssRetention,
              fedRetention: parsedData.fedRetention,
            });
            processedCompetences.add(target.competenceId);
          } else {
            summary.errors.push({ file: file.name, reason: `CNPJ ${parsedData.issuerCnpj} não cadastrado.` });
          }
        } else {
          summary.errors.push({ file: file.name, reason: 'XML de NFS-e inválido.' });
        }
      } catch (err) {
        summary.errors.push({ file: file.name, reason: 'Erro na leitura do XML da nota.' });
      }
    }

    for (const file of reinfFiles) {
      try {
        const xmlString = await file.text();
        const parsedData = await parseReinfXml(xmlString);

        if (parsedData) {
          const target = await findOrCreateTarget(
            parsedData.cnpj, 
            undefined, 
            manualCompanyId, 
            manualCompetenceId
          );

          if (target) {
            const reinfEvent = await prisma.reinfEvent.create({
              data: {
                eventType: parsedData.eventType,
                cnpj: parsedData.cnpj,
                invoiceReference: parsedData.invoiceReference,
                serviceValue: parsedData.serviceValue,
                retentionValue: parsedData.retentionValue,
                competenceId: target.competenceId,
              }
            });

            if (!summary.processed[target.competenceId]) {
              const comp = await prisma.competence.findUnique({ 
                where: { id: target.competenceId }, 
                include: { company: true } 
              });
              summary.processed[target.competenceId] = { 
                company: comp?.company.name || 'Desconhecida', 
                invoices: 0, 
                events: 0 
              };
            }
            summary.processed[target.competenceId].events++;

            if (!eventsByCompetence[target.competenceId]) eventsByCompetence[target.competenceId] = [];
            eventsByCompetence[target.competenceId].push({
              id: reinfEvent.id,
              invoiceReference: reinfEvent.invoiceReference,
              cnpj: reinfEvent.cnpj,
              retentionValue: reinfEvent.retentionValue,
            });
            processedCompetences.add(target.competenceId);
          } else {
            summary.errors.push({ file: file.name, reason: `CNPJ ${parsedData.cnpj} não cadastrado.` });
          }
        } else {
          summary.errors.push({ file: file.name, reason: 'XML REINF inválido.' });
        }
      } catch (err) {
        summary.errors.push({ file: file.name, reason: 'Erro na leitura do REINF.' });
      }
    }

    let totalDivergences = 0;
    
    for (const compId of processedCompetences) {
      const invoices = invoicesByCompetence[compId] || [];
      const events = eventsByCompetence[compId] || [];

      if (invoices.length > 0 && events.length === 0) {
        const pendingActions: any[] = [];
        
        invoices.forEach(inv => {
          const cleanCode = inv.serviceCode?.replace(/[^\d.]/g, '') || '';
          const rule = rulesMap.get(cleanCode);
          const natRendText = rule?.naturezaRendimento ? ` (Cód. Natureza: ${rule.naturezaRendimento})` : '';

          let inssTriggered = false;
          let fedTriggered = false;

          if (inv.inssRetention > 0) {
            pendingActions.push({
              status: 'WARNING',
              errorMessage: `[R-2010/2020] Falta lançar retenção de INSS da Nota ${inv.invoiceNumber}.`,
              expectedRetention: inv.inssRetention,
              reportedRetention: 0,
              invoiceId: inv.id,
            });
            inssTriggered = true;
          } else if (rule?.requireInss) {
            pendingActions.push({
              status: 'ERROR',
              errorMessage: `[Alerta Fiscal] Regra exige INSS, mas XML não destacou (Nota ${inv.invoiceNumber}).`,
              expectedRetention: 0,
              reportedRetention: 0,
              invoiceId: inv.id,
            });
            inssTriggered = true;
          }

          if (inv.fedRetention > 0) {
            pendingActions.push({
              status: 'WARNING',
              errorMessage: `[R-4020] Falta lançar retenções Federais da Nota ${inv.invoiceNumber}.${natRendText}`,
              expectedRetention: inv.fedRetention,
              reportedRetention: 0,
              invoiceId: inv.id,
            });
            fedTriggered = true;
          } else if (rule?.requireFed) {
            pendingActions.push({
              status: 'ERROR',
              errorMessage: `[Alerta Fiscal] Regra exige Federais, mas XML não destacou (Nota ${inv.invoiceNumber}).${natRendText}`,
              expectedRetention: 0,
              reportedRetention: 0,
              invoiceId: inv.id,
            });
            fedTriggered = true;
          }

          if (!inssTriggered && !fedTriggered && inv.retentionValue > 0) {
            pendingActions.push({
              status: 'WARNING',
              errorMessage: `[Ação Pendente] Declarar retenção genérica no EFD-Reinf da Nota ${inv.invoiceNumber}.`,
              expectedRetention: inv.retentionValue,
              reportedRetention: 0,
              invoiceId: inv.id,
            });
          }
        });

        if (pendingActions.length > 0) {
          totalDivergences += pendingActions.length;
          await prisma.divergence.createMany({
            data: pendingActions.map((div) => ({
              status: div.status,
              errorMessage: div.errorMessage,
              expectedRetention: div.expectedRetention,
              reportedRetention: div.reportedRetention,
              invoiceId: div.invoiceId,
              competenceId: compId,
            })),
          });
        }
      } 
      else if (invoices.length > 0 || events.length > 0) {
        const divergences = runValidationEngine(invoices, events);
        
        if (divergences.length > 0) {
          totalDivergences += divergences.length;
          await prisma.divergence.createMany({
            data: divergences.map((div) => ({
              status: div.status,
              errorMessage: div.errorMessage,
              expectedRetention: div.expectedRetention,
              reportedRetention: div.reportedRetention,
              invoiceId: div.invoiceId,
              competenceId: compId,
            })),
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Processamento concluído.',
      divergencesFound: totalDivergences,
      summary: {
        processed: Object.values(summary.processed),
        errors: summary.errors
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Erro geral no upload:', error);
    return NextResponse.json({ error: 'Erro interno ao processar arquivos.' }, { status: 500 });
  }
}