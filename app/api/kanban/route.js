import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const candidaturas = await prisma.candidatura.findMany({
      where: { usuarioId: session.user.id }
    });

    // Format to match local storage structure for easier frontend migration
    const formatadas = {};
    candidaturas.forEach(c => {
      formatadas[c.vagaLink] = {
        ...c,
        adicionadoEm: c.adicionadoEm.toISOString(),
      };
    });

    return NextResponse.json(formatadas);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar candidaturas' }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const data = await req.json();
    
    // Suporta sync de varias (array ou objeto)
    const records = Array.isArray(data) ? data : (data.vagas || [data]);
    
    let createdCount = 0;
    
    for (const v of records) {
      if (!v.vagaLink) continue;
      
      await prisma.candidatura.upsert({
        where: {
          usuarioId_vagaLink: {
            usuarioId: session.user.id,
            vagaLink: v.vagaLink
          }
        },
        update: {
          titulo: v.titulo,
          empresa: v.empresa,
          local: v.local,
          fonte: v.fonte,
          status: v.status || 'salvo',
          etiquetas: v.etiquetas || [],
          notas: v.notas,
          contatoRH: v.contatoRH,
          salario: v.salario,
          prazo: v.prazo,
          lembrete: v.lembrete
        },
        create: {
          usuarioId: session.user.id,
          vagaLink: v.vagaLink,
          titulo: v.titulo,
          empresa: v.empresa,
          local: v.local,
          fonte: v.fonte,
          status: v.status || 'salvo',
          etiquetas: v.etiquetas || [],
          notas: v.notas,
          contatoRH: v.contatoRH,
          salario: v.salario,
          prazo: v.prazo,
          lembrete: v.lembrete,
          adicionadoEm: v.adicionadoEm ? new Date(v.adicionadoEm) : new Date()
        }
      });
      createdCount++;
    }

    return NextResponse.json({ success: true, upserted: createdCount });
  } catch (error) {
    console.error('[kanban sync error]', error);
    return NextResponse.json({ error: 'Erro ao salvar candidaturas' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const vagaLink = url.searchParams.get('link');

    if (!vagaLink) return NextResponse.json({ error: 'Link necessário' }, { status: 400 });

    await prisma.candidatura.delete({
      where: {
        usuarioId_vagaLink: {
          usuarioId: session.user.id,
          vagaLink
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar candidatura' }, { status: 500 });
  }
}
