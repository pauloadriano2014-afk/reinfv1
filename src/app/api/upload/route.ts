import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseNfseXml, parseReinfXml } from '@/utils/parser';
import { runValidationEngine, ValidationInvoice, ValidationReinfEvent } from '@/utils/validation';
import { findOrCreateTarget } from '@/utils/upload-helper';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // IDs Manuais (serão nulos se for Super Upload)
    const manualCompanyId = formData.get('companyId') as string;
    const manualCompetenceId = formData.get('competenceId') as string;

    const nfseFiles = formData.getAll('nfse') as File[];
    const reinfFiles = formData.getAll('reinf') as File[];

    if (nfseFiles.length === 0 && reinfFiles.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Estrutura para o Log de Processamento
    const summary = {
      processed: {} as Record<string, { company: string; invoices: number; events: number }>,
      errors: [] as { file: string; reason: string }[]
    };

    // Mapas para agrupar dados por competência
    const invoicesByCompetence: Record<string, ValidationInvoice[]> = {};
    const eventsByCompetence: Record<string, ValidationReinfEvent[]> = {};
    const processedCompetences = new Set<string>();

    // 1. Processa NFS-e (Notas Fiscais)
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

            // Alimenta o Log
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
            });
            processedCompetences.add(target.competenceId);
          } else {
            summary.errors.push({ file: file.name, reason: `CNPJ ${parsedData.issuerCnpj} não cadastrado no sistema.` });
          }
        } else {
          summary.errors.push({ file: file.name, reason: 'XML de NFS-e inválido ou estrutura não reconhecida.' });
        }
      } catch (err) {
        summary.errors.push({ file: file.name, reason: 'Erro crítico na leitura do arquivo XML da nota.' });
      }
    }

    // 2. Processa Eventos REINF (Opcional a partir de agora)
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

            // Alimenta o Log
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
            summary.errors.push({ file: file.name, reason: `CNPJ ${parsedData.cnpj} não cadastrado no sistema.` });
          }
        } else {
          summary.errors.push({ file: file.name, reason: 'XML de evento REINF inválido ou estrutura não reconhecida.' });
        }
      } catch (err) {
        summary.errors.push({ file: file.name, reason: 'Erro crítico na leitura do arquivo XML do REINF.' });
      }
    }

    // 3. Validação Cruzada & Auditoria Prévia
    let totalDivergences = 0;
    
    for (const compId of processedCompetences) {
      const invoices = invoicesByCompetence[compId] || [];
      const events = eventsByCompetence[compId] || [];

      // NOVO FLUXO: Se não houver REINF, geramos alertas de "Ação Necessária" para cada nota com retenção
      if (invoices.length > 0 && events.length === 0) {
        const pendingActions = invoices
          .filter(inv => inv.retentionValue && inv.retentionValue > 0)
          .map(inv => ({
            status: 'WARNING' as const,
            errorMessage: `Ação Pendente: Declarar retenção no EFD-Reinf para a Nota ${inv.invoiceNumber}.`,
            expectedRetention: inv.retentionValue,
            reportedRetention: 0, // Zero porque nada foi enviado ainda
            invoiceId: inv.id,
          }));

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
      // FLUXO NORMAL: Existem Notas e Eventos REINF para cruzar
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