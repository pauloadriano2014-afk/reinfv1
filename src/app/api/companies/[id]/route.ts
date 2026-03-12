import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Função para EDITAR uma empresa (PATCH)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, cnpj } = body;

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: { name, cnpj },
    });

    return NextResponse.json(updatedCompany, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    return NextResponse.json({ error: 'Erro ao atualizar empresa' }, { status: 500 });
  }
}

// Função para EXCLUIR uma empresa (DELETE)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Atenção: O Prisma vai dar erro se houver competências vinculadas a esta empresa.
    // Primeiro deletamos ou avisamos sobre as dependências.
    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Empresa excluída com sucesso' }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao excluir empresa:', error);
    
    // Se o erro for de restrição de chave estrangeira (P2003)
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Não é possível excluir uma empresa que possui competências ou notas cadastradas.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Erro ao excluir empresa' }, { status: 500 });
  }
}