import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { link } = await req.json();

    if (!link) {
      return NextResponse.json({ error: 'O link da vaga é obrigatório.' }, { status: 400 });
    }

    const vagaAtualizada = await prisma.vaga.update({
      where: { link },
      data: { isTI: false },
    });

    return NextResponse.json({ success: true, vaga: vagaAtualizada });
  } catch (error) {
    console.error('[report]', error);
    return NextResponse.json({ error: 'Erro ao reportar a vaga.' }, { status: 500 });
  }
}
