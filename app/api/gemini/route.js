// Sistema de Vagas de TI em Bauru
// Criado por Daniel Ortega Pereira
// https://github.com/dnlortega/vagas-linkedin

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const PROMPTS = {
  resumir: ({ descricao }) => `
Você é um assistente de carreira. Leia a descrição abaixo e resuma em exatamente 3 bullets curtos (máx 15 palavras cada), em português. Seja direto e objetivo. Formato:
• <bullet 1>
• <bullet 2>
• <bullet 3>

Descrição:
${descricao}
`.trim(),

  redflags: ({ descricao }) => `
Analise a descrição da vaga abaixo e identifique possíveis red flags para o candidato. Considere: salário omitido, jornada excessiva, linguagem vaga ("dinâmico", "proativo", "família", "disponibilidade total"), acúmulo de funções, requisitos excessivos para o cargo, etc.

Se não houver red flags claros, diga "Nenhum red flag evidente encontrado."

Liste até 5 red flags no formato:
⚠️ <red flag> — <explicação curta>

Descrição:
${descricao}
`.trim(),

  carta: ({ titulo, empresa, descricao }) => `
Escreva uma carta de apresentação profissional e personalizada para candidatura à vaga abaixo. Seja conciso (3 parágrafos), tom profissional mas humano, em português brasileiro. Não invente dados do candidato — use "[Seu nome]" como placeholder. A carta deve mostrar interesse genuíno na empresa e alinhamento com os requisitos da vaga.

Vaga: ${titulo}
Empresa: ${empresa}

Descrição:
${descricao ? descricao.slice(0, 2000) : 'Não disponível'}
`.trim(),

  compatibilidade: ({ titulo, empresa, descricao }) => `
Analise a vaga abaixo e gere um relatório de compatibilidade para um candidato de TI de Bauru, SP. Seja honesto e útil.

Retorne no formato:
**Nível de compatibilidade:** <Baixo / Médio / Alto> (<score 0-100>%)
**Pontos fortes da vaga:** <lista com até 3 bullets>
**Desafios prováveis:** <lista com até 3 bullets>
**Recomendação:** <1 frase de conselho>

Vaga: ${titulo} — ${empresa}
Descrição:
${descricao ? descricao.slice(0, 2000) : 'Não disponível'}
`.trim(),

  traduzir: ({ descricao, titulo }) => `
Traduza o título e a descrição da vaga abaixo para o português brasileiro. Mantenha a formatação original. Se já estiver em português, responda apenas: "Esta vaga já está em português."

Título: ${titulo}

Descrição:
${descricao}
`.trim(),
};

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ erro: 'GEMINI_API_KEY não configurada. Crie .env.local com GEMINI_API_KEY=sua_chave' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Corpo da requisição inválido' }, { status: 400 });
  }

  const { acao, descricao, titulo, empresa } = body;
  if (!acao || !PROMPTS[acao]) {
    return NextResponse.json({ erro: `Ação inválida: ${acao}` }, { status: 400 });
  }
  if (!descricao && !titulo) {
    return NextResponse.json({ erro: 'Descrição ou título necessários' }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = PROMPTS[acao]({ descricao: descricao || '', titulo: titulo || '', empresa: empresa || '' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return NextResponse.json({ resultado: text });
  } catch (err) {
    console.error('[Gemini]', err);
    return NextResponse.json({ erro: err.message || 'Erro ao chamar a IA' }, { status: 500 });
  }
}
