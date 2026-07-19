// API de scraping de descrição de vagas unificada
// Suporta LinkedIn, VagasBauru, Indeed e outras fontes com cache no banco de dados Prisma
// Criado por Daniel Ortega Pereira

import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const HEADERS = {
  'User-Agent': UA,
  'Accept-Language': 'pt-BR,pt;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

function extrairIdLinkedIn(url) {
  const match = url.match(/view\/(\d+)/) || url.match(/currentJobId=(\d+)/) || url.match(/jobPosting\/(\d+)/) || url.match(/-(\d+)(?:\/|\?|$)/);
  return match ? match[1] : null;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Parâmetro url é obrigatório' }, { status: 400 });
  }

  try {
    // 1. Verificar se a vaga já existe no banco de dados e já possui descrição
    const vagaExistente = await prisma.vaga.findUnique({
      where: { link: url }
    });

    if (vagaExistente && vagaExistente.descricao) {
      return NextResponse.json({
        titulo: vagaExistente.titulo,
        empresa: vagaExistente.empresa,
        local: vagaExistente.local,
        descricao: vagaExistente.descricao,
        fonte: vagaExistente.fonte,
        criterios: {},
        competencias: [],
        cached: true
      });
    }

    // 2. Realizar scraping sob demanda com base na fonte
    let titulo = vagaExistente?.titulo || '';
    let empresa = vagaExistente?.empresa || '';
    let local = vagaExistente?.local || '';
    let descricao = '';
    let criterios = {};
    let competencias = [];
    let publicado = '';
    let candidatos = '';

    const isLinkedIn = url.includes('linkedin.com');
    const isVagasBauru = url.includes('vagasbauru.com.br');

    if (isLinkedIn) {
      const id = extrairIdLinkedIn(url);
      if (id) {
        const linkApi = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`;
        const resp = await axios.get(linkApi, { headers: HEADERS, timeout: 12000 });
        const $ = cheerio.load(resp.data);

        titulo = $('h2.top-card-layout__title').text().trim() || $('h1.top-card-layout__title').text().trim() || titulo;
        empresa = $('a.topcard__org-name-link').text().trim() || $('.topcard__org-name').text().trim() || empresa;
        local = $('.topcard__flavor--bullet').first().text().trim() || local;
        publicado = $('.posted-time-ago__text').text().trim() || $('.topcard__flavor--metadata').last().text().trim();
        candidatos = $('.num-applicants__caption').text().trim();

        // Critérios
        $('.description__job-criteria-item').each((_, el) => {
          const label = $(el).find('h3.description__job-criteria-subheader').text().trim();
          const value = $(el).find('span.description__job-criteria-text').text().trim();
          if (label && value) criterios[label] = value;
        });

        // Competências
        $('[class*="skill-pill"], .skill-pill__pill-name, [data-test="skill-pill"]').each((_, el) => {
          const t = $(el).text().trim();
          if (t && !competencias.includes(t)) competencias.push(t);
        });

        descricao = $('.show-more-less-html__markup').html()?.trim() || $('.description__text--rich').html()?.trim() || $('.description__text').html()?.trim() || '';
      }
    } else if (isVagasBauru) {
      const resp = await axios.get(url, { headers: HEADERS, timeout: 12000 });
      const $ = cheerio.load(resp.data);

      // Tenta carregar do JSON-LD
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || '{}');
          if (data['@type'] === 'JobPosting' && data.description) {
            descricao = data.description;
          }
        } catch (_) {}
      });

      // Fallback para seletores comuns de descrição do VagasBauru
      if (!descricao) {
        descricao = $('div.text-muted-foreground.leading-relaxed').html()?.trim() || $('[style*="word-break"]').html()?.trim() || $('main').html()?.trim() || '';
      }
    } else {
      // Outras fontes: Scraping Genérico
      try {
        const resp = await axios.get(url, { headers: HEADERS, timeout: 12000 });
        const $ = cheerio.load(resp.data);

        // Busca JSON-LD
        $('script[type="application/ld+json"]').each((_, el) => {
          try {
            const data = JSON.parse($(el).html() || '{}');
            if (data['@type'] === 'JobPosting' && data.description) {
              descricao = data.description;
            }
          } catch (_) {}
        });

        if (!descricao) {
          // Seletores genéricos comuns de vagas
          descricao = $('.job-description').html() || $('.descricao').html() || $('#description').html() || $('article').html() || '';
        }
      } catch (err) {
        console.warn(`[generic-scraping] erro ao buscar detalhes no link ${url}:`, err.message);
      }
    }

    // 3. Atualizar o banco de dados com a descrição encontrada
    if (descricao) {
      // Limpar formatação ou manter HTML limpo
      descricao = descricao.trim();

      if (vagaExistente) {
        await prisma.vaga.update({
          where: { id: vagaExistente.id },
          data: { descricao }
        });
      } else {
        // Se a vaga não existia por algum motivo, vamos criá-la
        await prisma.vaga.create({
          data: {
            titulo: titulo || 'Vaga',
            empresa: empresa || 'N/A',
            local: local || 'Bauru, SP',
            link: url,
            descricao,
            termo: 'geral',
            fonte: isLinkedIn ? 'linkedin' : isVagasBauru ? 'vagasbauru' : 'externo',
          }
        });
      }
    }

    return NextResponse.json({
      titulo,
      empresa,
      local,
      publicado,
      candidatos,
      criterios,
      competencias,
      descricao: descricao || 'A descrição detalhada desta vaga não pôde ser carregada automaticamente. Por favor, acesse o link oficial para ler a descrição completa.',
      cached: false
    });

  } catch (error) {
    console.error(`Erro na API /api/vaga:`, error.message);
    return NextResponse.json({
      error: 'Erro ao obter detalhes da vaga.',
      descricao: 'Não foi possível carregar a descrição no momento. Acesse o link da vaga para visualizar os detalhes.'
    }, { status: 500 });
  }
}
