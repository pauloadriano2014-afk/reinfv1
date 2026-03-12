import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { resolved } = await request.json();

    const updated = await prisma.divergence.update({
      where: { id },
      data: { resolved },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar status.' }, { status: 500 });
  }
}