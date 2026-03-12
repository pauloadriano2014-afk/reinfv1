import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 1. Busca os totais para os cards
    const [companyCount, invoiceCount, divergenceCount] = await Promise.all([
      prisma.company.count(),
      prisma.invoice.count(),
      prisma.divergence.count({ where: { resolved: false } }),
    ]);

    // 2. Busca empresas que NÃO têm competência no mês/ano atual
    const pendingCompanies = await prisma.company.findMany({
      where: {
        NOT: {
          competences: {
            some: {
              month: currentMonth,
              year: currentYear,
            },
          },
        },
      },
      select: {
        name: true,
        cnpj: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      stats: {
        companies: companyCount,
        invoices: invoiceCount,
        divergences: divergenceCount,
      },
      pendingCompanies,
      period: {
        month: currentMonth,
        year: currentYear
      }
    });
  } catch (error) {
    console.error('Erro ao buscar stats:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}