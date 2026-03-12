import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID da regra não fornecido.' }, { status: 400 });
    }

    // Exclui a regra fiscal do banco de dados
    await prisma.taxRule.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: 'Regra fiscal excluída com sucesso.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir regra fiscal:', error);
    return NextResponse.json(
      { error: 'Erro interno ao excluir a regra fiscal.' },
      { status: 500 }
    );
  }
}