import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const rules = await prisma.taxRule.findMany({
      orderBy: { serviceCode: 'asc' }
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error('Erro ao buscar regras:', error);
    return NextResponse.json({ error: 'Erro ao buscar regras' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serviceCode, description, requireInss, requireFed, naturezaRendimento } = body;

    const newRule = await prisma.taxRule.create({
      data: {
        serviceCode,
        description,
        requireInss,
        requireFed,
        naturezaRendimento,
      }
    });

    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar regra:', error);
    return NextResponse.json({ error: 'Erro ao criar regra. Verifique se o código já existe.' }, { status: 500 });
  }
}