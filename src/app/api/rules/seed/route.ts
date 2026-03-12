import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const standardRules = [
  { serviceCode: '07.02', description: 'Execução por empreitada de obras de construção civil', requireInss: true, requireFed: true },
  { serviceCode: '07.10', description: 'Limpeza, manutenção e conservação', requireInss: true, requireFed: true },
  { serviceCode: '11.02', description: 'Vigilância, segurança ou monitoramento', requireInss: true, requireFed: true },
  { serviceCode: '17.01', description: 'Assessoria ou consultoria de qualquer natureza', requireInss: false, requireFed: true },
  { serviceCode: '17.06', description: 'Propaganda e publicidade', requireInss: false, requireFed: true },
  { serviceCode: '10.05', description: 'Agenciamento, corretagem ou intermediação', requireInss: false, requireFed: true },
  { serviceCode: '17.02', description: 'Datilografia, digitação, estenografia e tradução', requireInss: false, requireFed: true },
  { serviceCode: '17.14', description: 'Advocacia', requireInss: false, requireFed: true },
  { serviceCode: '07.05', description: 'Reparação, conservação e reforma de edifícios', requireInss: true, requireFed: true },
  { serviceCode: '37.01', description: 'Serviços de contabilidade, auditoria e técnicos', requireInss: false, requireFed: true },
];

export async function GET() {
  try {
    let count = 0;
    
    // Loop para inserir apenas as regras que ainda não existem
    for (const rule of standardRules) {
      const exists = await prisma.taxRule.findUnique({
        where: { serviceCode: rule.serviceCode }
      });

      if (!exists) {
        await prisma.taxRule.create({ data: rule });
        count++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${count} regras fiscais padrão foram carregadas com sucesso!` 
    });
  } catch (error) {
    console.error('Erro no seed de regras:', error);
    return NextResponse.json({ error: 'Erro ao carregar regras.' }, { status: 500 });
  }
}