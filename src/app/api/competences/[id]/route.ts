import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { month, year } = body;

    const updatedCompetence = await prisma.competence.update({
      where: { id },
      data: { 
        month: Number(month), 
        year: Number(year) 
      },
    });

    return NextResponse.json(updatedCompetence, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar competência' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.competence.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Competência excluída' }, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Não é possível excluir uma competência que já possui notas fiscais vinculadas.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Erro ao excluir competência' }, { status: 500 });
  }
}