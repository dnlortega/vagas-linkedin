import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { email: session.user.email },
      select: { preferencias: true, filtrosPadrao: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ 
      preferencias: user.preferencias || [], 
      filtrosPadrao: user.filtrosPadrao || {} 
    });
  } catch (error) {
    console.error('[API Perfil] Erro no GET:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = {};
    if (body.preferencias !== undefined) data.preferencias = Array.isArray(body.preferencias) ? body.preferencias : [];
    if (body.filtrosPadrao !== undefined) data.filtrosPadrao = body.filtrosPadrao;

    const updatedUser = await prisma.usuario.update({
      where: { email: session.user.email },
      data
    });

    return NextResponse.json({ success: true, preferencias: updatedUser.preferencias });
  } catch (error) {
    console.error('[API Perfil] Erro no PUT:', error);
    return NextResponse.json({ error: 'Erro ao atualizar as preferências' }, { status: 500 });
  }
}
