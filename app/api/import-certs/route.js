// API de importação de certificados Gupy
// Criado por Daniel Ortega Pereira
// https://github.com/dnlortega/vagas-linkedin

import { NextResponse } from 'next/server';

// Armazenamento temporário em memória (limpa após leitura)
let pendingCerts = null;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request) {
  try {
    const { certs } = await request.json();
    if (!Array.isArray(certs) || certs.length === 0) {
      return NextResponse.json({ error: 'nenhum certificado' }, { status: 400, headers: corsHeaders() });
    }
    pendingCerts = certs.map((c, i) => ({
      id: `li_auto_${Date.now()}_${i}`,
      nome: String(c.nome || '').trim(),
      emissor: String(c.emissor || '').trim(),
      data: String(c.data || '').trim(),
      dataExpiracao: String(c.dataExpiracao || '').trim(),
      credencial: String(c.credencial || '').trim(),
      url: String(c.url || '').trim(),
      logoUrl: String(c.logoUrl || '').trim(),
    }));
    return NextResponse.json({ ok: true, count: pendingCerts.length }, { headers: corsHeaders() });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function GET() {
  if (!pendingCerts) {
    return NextResponse.json({ certs: null }, { headers: corsHeaders() });
  }
  const certs = pendingCerts;
  pendingCerts = null;
  return NextResponse.json({ certs }, { headers: corsHeaders() });
}
