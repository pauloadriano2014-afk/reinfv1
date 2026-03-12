import prisma from '@/lib/prisma';

export async function findOrCreateTarget(cnpj: string, dateStr?: string, manualCompanyId?: string, manualCompetenceId?: string) {
  // Se já temos os IDs manuais (modo contextual), apenas retornamos eles
  if (manualCompanyId && manualCompetenceId) {
    return { companyId: manualCompanyId, competenceId: manualCompetenceId };
  }

  // Se for Super Upload (identificação automática por CNPJ)
  const company = await prisma.company.findUnique({
    where: { cnpj: cnpj.replace(/\D/g, '') } // Limpa pontos e traços
  });

  if (!company) return null;

  // Extrai mês e ano da data (Ex: 2024-01-15 -> mês 1, ano 2024)
  const date = dateStr ? new Date(dateStr) : new Date();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // Busca ou cria a competência automaticamente
  const competence = await prisma.competence.upsert({
    where: {
      month_year_companyId: {
        month,
        year,
        companyId: company.id
      }
    },
    update: {}, // Se já existir, não muda nada
    create: {
      month,
      year,
      companyId: company.id
    }
  });

  return { companyId: company.id, competenceId: competence.id };
}