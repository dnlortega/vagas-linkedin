// API de detalhes de vaga individual
// Criado por Daniel Ortega Pereira
// https://github.com/dnlortega/vagas-linkedin

import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9',
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
};

const cache = new Map();
const TTL = 30 * 60 * 1000;

export async function GET(req, context) {
  const { id } = await context.params;

  const hit = cache.get(id);
  if (hit && Date.now() - hit.ts < TTL) {
    return NextResponse.json(hit.data);
  }

  try {
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`;
    const resp = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(resp.data);

    // Informações do topo
    const titulo =
      $('h2.top-card-layout__title').text().trim() ||
      $('h1.top-card-layout__title').text().trim();

    const empresa =
      $('a.topcard__org-name-link').text().trim() ||
      $('.topcard__org-name').text().trim();

    const local = $('.topcard__flavor--bullet').first().text().trim();

    const publicado =
      $('.posted-time-ago__text').text().trim() ||
      $('.topcard__flavor--metadata').last().text().trim();

    const candidatos = $('.num-applicants__caption').text().trim();

    // Critérios (nível, tipo de emprego, função, indústrias)
    const criterios = {};
    $('.description__job-criteria-item').each((_, el) => {
      const label = $(el).find('h3.description__job-criteria-subheader').text().trim();
      const value = $(el).find('span.description__job-criteria-text').text().trim();
      if (label && value) criterios[label] = value;
    });

    // Competências listadas
    const competencias = [];
    $('[class*="skill-pill"], .skill-pill__pill-name, [data-test="skill-pill"]').each((_, el) => {
      const t = $(el).text().trim();
      if (t && !competencias.includes(t)) competencias.push(t);
    });

    // Descrição completa (HTML)
    const descricao =
      $('.show-more-less-html__markup').html()?.trim() ||
      $('.description__text--rich').html()?.trim() ||
      $('.description__text').html()?.trim() ||
      '';

    const data = { titulo, empresa, local, publicado, candidatos, criterios, competencias, descricao };

    cache.set(id, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
