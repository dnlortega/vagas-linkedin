// API de scraping de vagas em Bauru — LinkedIn, VagasBauru, Indeed, Vagas.com, Catho, CIEE, Empregos.com
// Criado por Daniel Ortega Pereira
// https://github.com/dnlortega/vagas-linkedin

import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import nodemailer from 'nodemailer';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const HEADERS_HTML = { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9', Accept: 'text/html,*/*;q=0.8' };
const HEADERS_JSON = { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9', Accept: 'application/json' };

const CIDADES = ['bauru', 'guarulhos', 'são paulo', 'sp'];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function naRegiao(local) {
  const l = (local || '').toLowerCase();
  return CIDADES.some(c => l.includes(c)) || l.includes('remot') || l.includes('híbrid') || l.includes('hibrido');
}

async function fetchHtml(targetUrl, options = {}) {
  const apiKey = process.env.SCRAPER_API_KEY;
  if (apiKey) {
    // Usa ScraperAPI para contornar bloqueios se a chave existir
    const scraperUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
    return axios.get(scraperUrl, { timeout: options.timeout || 25000 });
  }
  return axios.get(targetUrl, options);
}

// ─── LinkedIn ────────────────────────────────────────────────────────────────

const TERMOS_LINKEDIN = [
  'desenvolvedor',        'programador',          'suporte técnico',
  'devops',               'engenheiro software',  'analista de sistemas',
  'QA testes',            'segurança da informação', 'cloud computing',
  'banco de dados',       'data science',         'infraestrutura TI',
  'ti bauru',             'power bi',             'analista de dados',
  'suporte de TI',        'DBA',                  'desenvolvimento analítico',
  'desenvolvimento',      'analista',             'analítico'
];

async function linkedinPagina(keyword, start) {
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent('São Paulo, Brasil')}&start=${start}&count=25`;
  const resp = await fetchHtml(url, { headers: HEADERS_HTML, timeout: 12000 });
  const $ = cheerio.load(resp.data);
  const vagas = [];
  $('li').each((_, el) => {
    const titulo  = $(el).find('h3.base-search-card__title').text().trim();
    const empresa = $(el).find('h4.base-search-card__subtitle').text().trim() || 'N/A';
    const local   = $(el).find('span.job-search-card__location').text().trim() || 'N/A';
    const data    = $(el).find('time.job-search-card__listdate').attr('datetime') || null;
    const link    = ($(el).find('a.base-card__full-link').attr('href') || '').split('?')[0];
    if (titulo && link) vagas.push({ titulo, empresa, local, data, link, termo: keyword, fonte: 'linkedin' });
  });
  return vagas;
}

async function fetchLinkedIn() {
  const todas = [];
  for (const termo of TERMOS_LINKEDIN) {
    try {
      const p1 = await linkedinPagina(termo, 0);
      todas.push(...p1);
      if (p1.length >= 10) {
        await sleep(300);
        const p2 = await linkedinPagina(termo, 25);
        todas.push(...p2);
        if (p2.length >= 10) {
          await sleep(300);
          const p3 = await linkedinPagina(termo, 50);
          todas.push(...p3);
          if (p3.length >= 10) {
            await sleep(300);
            const p4 = await linkedinPagina(termo, 75);
            todas.push(...p4);
          }
        }
      }
    } catch (err) {
      console.error(`[linkedin] "${termo}":`, err.message);
    }
    await sleep(400);
  }
  return todas;
}

// ─── VagasBauru ──────────────────────────────────────────────────────────────

async function fetchVagasBauru() {
  const todas = [];
  try {
    const resp = await axios.get('https://vagasbauru.com.br/api/vagas', {
      params: { limit: 500 },
      headers: HEADERS_JSON,
      timeout: 10000,
    });
    const jobs = resp.data?.dados || [];
    for (const job of jobs) {
      const titulo = job.titulo || 'Vaga';
      const cidade = job.cidade_vizinha || job.cidade || 'Bauru';
      const estado = job.cidade_vizinha_estado || job.estado || 'SP';
      const local  = `${cidade}, ${estado}`;
      todas.push({
        titulo,
        empresa: job.empresa_dados?.nome_fantasia || job.empresa || 'N/A',
        local,
        data:    job.criado_em ? job.criado_em.split('T')[0] : null,
        link:    `https://vagasbauru.com.br/vagas/${job.slug}`,
        termo:   'vagasbauru',
        fonte:   'vagasbauru',
      });
    }
  } catch (err) {
    console.error('[vagasbauru]', err.message);
  }
  return todas;
}

// ─── Indeed ──────────────────────────────────────────────────────────────────

const TERMOS_INDEED = ['desenvolvedor', 'programador', 'analista sistemas', 'suporte técnico'];

async function fetchIndeed() {
  const todas = [];
  for (const termo of TERMOS_INDEED) {
    try {
      const url = `https://br.indeed.com/empregos?q=${encodeURIComponent(termo)}&l=${encodeURIComponent('Bauru, SP')}&fromage=30&sort=date`;
      const resp = await fetchHtml(url, {
        headers: {
          'User-Agent': UA,
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': 'https://br.indeed.com/',
          'Sec-Fetch-Mode': 'navigate',
        },
        timeout: 15000,
      });
      const $ = cheerio.load(resp.data);
      $('div.job_seen_beacon').each((_, el) => {
        const titulo  = $(el).find('h2.jobTitle span[title], h2.jobTitle a span').first().text().trim();
        const empresa = $(el).find('[data-testid="company-name"], .companyName').first().text().trim() || 'N/A';
        const local   = $(el).find('[data-testid="text-location"], .companyLocation').first().text().trim() || 'Bauru, SP';
        const href    = $(el).find('h2.jobTitle a, a[id^="job_"]').first().attr('href') || '';
        const link    = href.startsWith('http') ? href : `https://br.indeed.com${href}`;
        if (titulo && href) {
          todas.push({ titulo, empresa, local, data: null, link: link.split('?')[0], termo, fonte: 'indeed' });
        }
      });
      await sleep(500);
    } catch (err) {
      if (!err.response || err.response.status !== 403) console.error(`[indeed] "${termo}":`, err.message);
    }
  }
  return todas;
}

// ─── Vagas.com.br ────────────────────────────────────────────────────────────

async function fetchVagasCom() {
  const todas = [];
  const termos = ['desenvolvedor', 'programador', 'analista', 'suporte-tecnico'];
  for (const termo of termos) {
    try {
      const url = `https://www.vagas.com.br/vagas-de-${termo}-em-bauru-sp`;
      const resp = await fetchHtml(url, {
        headers: { ...HEADERS_HTML, Referer: 'https://www.vagas.com.br/' },
        timeout: 12000,
      });
      const $ = cheerio.load(resp.data);
      $('li.opportunity').each((_, el) => {
        const titulo  = $(el).find('h2.opportunity-title a, .job-shortdescription__title').text().trim();
        const empresa = $(el).find('.opportunity-company, .job-shortdescription__company').text().trim() || 'N/A';
        const local   = $(el).find('.opportunity-workplace, .job-shortdescription__location').text().trim() || 'Bauru, SP';
        const href    = $(el).find('h2.opportunity-title a, a.job-shortdescription__title').attr('href') || '';
        const link    = href.startsWith('http') ? href : `https://www.vagas.com.br${href}`;
        if (titulo && href) {
          todas.push({ titulo, empresa, local, data: null, link, termo, fonte: 'vagascom' });
        }
      });
      await sleep(400);
    } catch (err) {
      if (!err.response || ![403, 404].includes(err.response.status)) console.error(`[vagascom] "${termo}":`, err.message);
    }
  }
  return todas;
}

// ─── Empregos.com.br ─────────────────────────────────────────────────────────

async function fetchEmpregosCom() {
  const todas = [];
  const termos = ['desenvolvedor', 'programador', 'suporte-tecnico', 'analista'];
  for (const termo of termos) {
    try {
      const resp = await axios.get(`https://www.empregos.com.br/empregos/${termo}/bauru-sp`, {
        headers: { ...HEADERS_HTML, Referer: 'https://www.empregos.com.br/' },
        timeout: 12000,
      });
      const $ = cheerio.load(resp.data);
      $('article.card-vaga, .vaga-item, [class*="CardVaga"], [data-testid*="vaga"]').each((_, el) => {
        const titulo  = $(el).find('h2, h3, [class*="title"], [class*="titulo"]').first().text().trim();
        const empresa = $(el).find('[class*="company"], [class*="empresa"]').first().text().trim() || 'N/A';
        const href    = $(el).find('a').first().attr('href') || '';
        const link    = href.startsWith('http') ? href : `https://www.empregos.com.br${href}`;
        if (titulo && href) {
          todas.push({ titulo, empresa, local: 'Bauru, SP', data: null, link: link.split('?')[0], termo, fonte: 'empregoscom' });
        }
      });
      await sleep(400);
    } catch (err) {
      if (!err.response || ![403, 404].includes(err.response.status)) console.error(`[empregos.com] "${termo}":`, err.message);
    }
  }
  return todas;
}

// ─── Catho ───────────────────────────────────────────────────────────────────

const TERMOS_CATHO = ['desenvolvedor', 'programador', 'analista', 'suporte+tecnico'];

async function fetchCatho() {
  const todas = [];
  for (const termo of TERMOS_CATHO) {
    try {
      const url = `https://www.catho.com.br/vagas/?q=${encodeURIComponent(termo)}&l=bauru-sp`;
      const resp = await fetchHtml(url, {
        headers: {
          ...HEADERS_HTML,
          Referer: 'https://www.catho.com.br/',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 12000,
      });
      const $ = cheerio.load(resp.data);
      // Catho usa JSON-LD com os dados das vagas
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || '{}');
          const items = data['@type'] === 'ItemList' ? (data.itemListElement || []) : [];
          items.forEach(item => {
            const job = item.item || item;
            const titulo  = job.title || job.name || '';
            const empresa = job.hiringOrganization?.name || 'N/A';
            const local   = job.jobLocation?.address?.addressLocality || 'Bauru, SP';
            const link    = job.url || '';
            if (titulo && link) {
              todas.push({ titulo, empresa, local: `${local}, SP`, data: null, link: link.split('?')[0], termo, fonte: 'catho' });
            }
          });
        } catch (_) {}
      });
      // Fallback para HTML
      if (todas.filter(v => v.termo === termo).length === 0) {
        $('[data-testid="job-card"], .job-card, article[class*="job"]').each((_, el) => {
          const titulo  = $(el).find('h2, h3, [class*="title"]').first().text().trim();
          const empresa = $(el).find('[class*="company"], [class*="employer"]').first().text().trim() || 'N/A';
          const href    = $(el).find('a').first().attr('href') || '';
          const link    = href.startsWith('http') ? href : `https://www.catho.com.br${href}`;
          if (titulo && href) {
            todas.push({ titulo, empresa, local: 'Bauru, SP', data: null, link: link.split('?')[0], termo, fonte: 'catho' });
          }
        });
      }
      await sleep(500);
    } catch (err) {
      if (!err.response || ![403, 404].includes(err.response.status)) console.error(`[catho] "${termo}":`, err.message);
    }
  }
  return todas;
}

// ─── CIEE ─────────────────────────────────────────────────────────────────────

async function fetchCIEE() {
  const todas = [];
  try {
    const resp = await axios.get('https://portal.ciee.org.br/vagas/estagio-e-aprendiz/', {
      params: { estado: 'SP', cidade: 'Bauru', area: 'tecnologia-da-informacao' },
      headers: { ...HEADERS_HTML, Referer: 'https://portal.ciee.org.br/' },
      timeout: 12000,
    });
    const $ = cheerio.load(resp.data);
    $('[class*="vaga"], [class*="card-vaga"], .vaga-item, article.vaga').each((_, el) => {
      const titulo  = $(el).find('[class*="titulo"], [class*="title"], h2, h3').first().text().trim();
      const empresa = $(el).find('[class*="empresa"], [class*="company"]').first().text().trim() || 'N/A';
      const local   = 'Bauru, SP';
      const href    = $(el).find('a').first().attr('href') || '';
      const link    = href.startsWith('http') ? href : `https://portal.ciee.org.br${href}`;
      if (titulo && titulo.length > 3 && href) {
        todas.push({ titulo, empresa, local, data: null, link, termo: 'ciee', fonte: 'ciee' });
      }
    });
  } catch (err) {
    if (!err.response || ![403, 404].includes(err.response.status)) console.error('[ciee]', err.message);
  }
  return todas;
}

// ─── Quero Vagas Tech ────────────────────────────────────────────────────────

const TERMOS_TI_REGEX = /\b(desenvolvedor|programador|software|fullstack|full[- ]?stack|front[- ]?end|back[- ]?end|devops|sre|cloud|dados|data|bi\b|power\s?bi|analista.*(?:sistema|ti|dados|suporte)|engenheiro.*(?:software|dados|cloud)|arquiteto.*(?:ti|software|solu)|dba|banco.*dados|infraestrutura.*ti|segurança.*informação|cibersegurança|machine learning|inteligência artificial|\bai\b|\bia\b|qa|teste.*software|scrum|agile|product.*owner|\bpo\b|tech lead|\bux\b|\bui\b|designer.*(?:ux|ui|produto)|mobile|android|ios|flutter|react|angular|vue|node|python|java(?!script)|javascript|typescript|\bc#|csharp|\.net|dotnet|php|ruby|golang|rust|kotlin|swift|sql|nosql|mongo|postgres|mysql|redis|kafka|docker|kubernetes|terraform|aws|azure|gcp|linux|redes|telecom|suporte.*(?:ti|técnico)|help.*desk|service.*desk|field.*service|\bti\b|\bit\b|tecnologia|tech|\berp\b|\bsap\b|\btotvs\b|\bcrm\b|salesforce|\brpa\b|automação|iot|embedded|firmware|\bvlsi\b|hardware|\bpcb\b|fpga|microcontrolador)\b/i;

async function fetchQueroVagasTech() {
  const todas = [];
  const MAX_PAGES = 7; // até ~210 vagas
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const resp = await axios.get('https://www.querovagastech.com.br/api/jobs', {
        params: { page, pageSize: 30, sort: 'postedAt:desc' },
        headers: HEADERS_JSON,
        timeout: 15000,
      });
      const data = resp.data;
      const items = data?.items || [];
      if (items.length === 0) break;

      for (const job of items) {
        const titulo = job.title || '';
        // Filtra apenas vagas relacionadas a TI
        if (!TERMOS_TI_REGEX.test(titulo)) continue;

        const local = job.location || 'Brasil';
        const dataPost = job.postedAt ? job.postedAt.split('T')[0] : null;
        todas.push({
          titulo,
          empresa: job.company || 'N/A',
          local,
          data: dataPost,
          link: job.applyUrl || `https://www.querovagastech.com.br/`,
          termo: 'querovagastech',
          fonte: 'querovagastech',
        });
      }

      // Se já buscou todas as vagas disponíveis, para
      if (page * 30 >= (data.total || 0)) break;
      await sleep(300);
    }
  } catch (err) {
    console.error('[querovagastech]', err.message);
  }
  return todas;
}

// ─── Cache com stale-while-revalidate ────────────────────────────────────────

let cacheData = null;
let cacheTs   = 0;
let refreshing = false;

// ─── Agile Bauru ──────────────────────────────────────────────────────────────
async function fetchAgileBauru() {
  const todas = [];
  try {
    const resp = await axios.get('https://agile-bauru.hera.app.br/vagas', { headers: HEADERS_HTML, timeout: 10000 });
    const $ = cheerio.load(resp.data);
    
    // Tentativa genérica de buscar cards de vaga
    $('a').each((_, el) => {
      const link = $(el).attr('href') || '';
      if (link.includes('/vagas/') || link.includes('/job')) {
        const titulo = $(el).text().trim().replace(/\s+/g, ' ');
        if (titulo.length > 5) {
          todas.push({
            titulo: titulo.substring(0, 80),
            empresa: 'Agile Bauru',
            local: 'Bauru, SP',
            data: null,
            link: link.startsWith('http') ? link : `https://agile-bauru.hera.app.br${link}`,
            termo: 'agilebauru',
            fonte: 'agilebauru',
          });
        }
      }
    });
  } catch (err) {
    console.error('[agilebauru]', err.message);
  }
  return todas;
}

// ─── Programathor ─────────────────────────────────────────────────────────────
async function fetchProgramathor() {
  const todas = [];
  try {
    const resp = await axios.get('https://programathor.com.br/jobs', { headers: HEADERS_HTML, timeout: 10000 });
    const $ = cheerio.load(resp.data);
    $('.mac-box-job').each((_, el) => {
      const titulo = $(el).find('h3, .text-24').first().text().trim();
      const empresa = $(el).find('.job-company-name').text().trim() || 'N/A';
      const isRemoto = $(el).text().toLowerCase().includes('remoto');
      const href = $(el).find('a').first().attr('href') || '';
      
      if (titulo && href) {
        todas.push({
          titulo,
          empresa,
          local: isRemoto ? 'Remoto' : 'Brasil',
          data: null,
          link: href.startsWith('http') ? href : `https://programathor.com.br${href}`,
          termo: 'programathor',
          fonte: 'programathor',
        });
      }
    });
  } catch (err) {
    console.error('[programathor]', err.message);
  }
  return todas;
}
// ─── Trabalha Brasil ─────────────────────────────────────────────────────────

async function fetchTrabalhaBrasil() {
  const todas = [];
  try {
    const resp = await axios.get('https://www.trabalhabrasil.com.br/vagas-empregos-em-bauru-sp/tecnologia-da-informacao', { headers: HEADERS_HTML, timeout: 12000 });
    const $ = cheerio.load(resp.data);
    $('.job-vacancy').each((_, el) => {
      const titulo = $(el).find('.job-vacancy-title, h2, h3').text().trim();
      const empresa = $(el).find('.job-vacancy-company, .company').text().trim() || 'N/A';
      const href = $(el).attr('href') || $(el).find('a').attr('href') || '';
      if (titulo && href) {
        todas.push({
          titulo,
          empresa,
          local: 'Bauru, SP',
          data: null,
          link: href.startsWith('http') ? href : `https://www.trabalhabrasil.com.br${href}`,
          termo: 'ti',
          fonte: 'trabalhabrasil',
        });
      }
    });
    await sleep(500);
  } catch (err) {
    console.error('[trabalhabrasil]', err.message);
  }
  return todas;
}

// ─── InfoJobs ─────────────────────────────────────────────────────────────────
async function fetchInfoJobs() {
  const todas = [];
  try {
    const resp = await axios.get('https://www.infojobs.com.br/vagas-de-emprego-ti-em-bauru,-sp.aspx', { headers: HEADERS_HTML, timeout: 10000 });
    const $ = cheerio.load(resp.data);
    $('.js_jobVacancy').each((_, el) => {
      const titulo = $(el).find('.js_vacancyTitle').text().trim() || $(el).find('h2').text().trim();
      const empresa = $(el).find('.js_vacancyCompany').text().trim() || 'N/A';
      const href = $(el).find('a').first().attr('href') || '';
      
      if (titulo && href) {
        todas.push({
          titulo,
          empresa,
          local: 'Bauru, SP',
          data: null,
          link: href.startsWith('http') ? href : `https://www.infojobs.com.br${href}`,
          termo: 'infojobs',
          fonte: 'infojobs',
        });
      }
    });
  } catch (err) {
    console.error('[infojobs]', err.message);
  }
  return todas;
}

// ─── Cache com stale-while-revalidate ────────────────────────────────────────
const TTL_FRESCO  = 60 * 60 * 1000; // 1 hora: serve direto do cache, sem refresh
const TTL_VALIDO  = 60 * 60 * 1000; // 1 hora: expira o cache após esse tempo

async function buildData() {
  const [linkedin, vagasbauru, indeed, vagascom, ciee, catho, empregoscom, querovagastech, agilebauru, programathor, infojobs, trabalhabrasil] = await Promise.allSettled([
    fetchLinkedIn(),
    fetchVagasBauru(),
    fetchIndeed(),
    fetchVagasCom(),
    fetchCIEE(),
    fetchCatho(),
    fetchEmpregosCom(),
    fetchQueroVagasTech(),
    fetchAgileBauru(),
    fetchProgramathor(),
    fetchInfoJobs(),
    fetchTrabalhaBrasil(),
  ]);

  const FONTES_LOCAIS = new Set(['vagasbauru', 'indeed', 'vagascom', 'ciee', 'catho', 'empregoscom', 'querovagastech', 'agilebauru', 'programathor', 'infojobs', 'trabalhabrasil']);

  const todas = [
    ...(linkedin.status       === 'fulfilled' ? linkedin.value       : []),
    ...(vagasbauru.status     === 'fulfilled' ? vagasbauru.value     : []),
    ...(indeed.status         === 'fulfilled' ? indeed.value         : []),
    ...(vagascom.status       === 'fulfilled' ? vagascom.value       : []),
    ...(ciee.status           === 'fulfilled' ? ciee.value           : []),
    ...(catho.status          === 'fulfilled' ? catho.value          : []),
    ...(empregoscom.status    === 'fulfilled' ? empregoscom.value    : []),
    ...(querovagastech.status === 'fulfilled' ? querovagastech.value : []),
    ...(agilebauru.status     === 'fulfilled' ? agilebauru.value     : []),
    ...(programathor.status   === 'fulfilled' ? programathor.value   : []),
    ...(infojobs.status       === 'fulfilled' ? infojobs.value       : []),
    ...(trabalhabrasil.status === 'fulfilled' ? trabalhabrasil.value : []),
  ].filter(v => naRegiao(v.local) || !v.local || v.local === 'N/A' || FONTES_LOCAIS.has(v.fonte));

  // Deduplicar por link
  const vistas = new Set();
  const unicas = todas.filter(v => {
    if (!v.link || vistas.has(v.link)) return false;
    vistas.add(v.link);
    return true;
  });

  const fontes = {
    linkedin:       unicas.filter(v => v.fonte === 'linkedin').length,
    vagasbauru:     unicas.filter(v => v.fonte === 'vagasbauru').length,
    indeed:         unicas.filter(v => v.fonte === 'indeed').length,
    vagascom:       unicas.filter(v => v.fonte === 'vagascom').length,
    ciee:           unicas.filter(v => v.fonte === 'ciee').length,
    catho:          unicas.filter(v => v.fonte === 'catho').length,
    empregoscom:    unicas.filter(v => v.fonte === 'empregoscom').length,
    querovagastech: unicas.filter(v => v.fonte === 'querovagastech').length,
    agilebauru:     unicas.filter(v => v.fonte === 'agilebauru').length,
    programathor:   unicas.filter(v => v.fonte === 'programathor').length,
    infojobs:       unicas.filter(v => v.fonte === 'infojobs').length,
    trabalhabrasil: unicas.filter(v => v.fonte === 'trabalhabrasil').length,
  };

  console.log(`[vagas] ${unicas.length} únicas | LinkedIn:${fontes.linkedin} VagasBauru:${fontes.vagasbauru} TrabalhaBrasil:${fontes.trabalhabrasil} Catho:${fontes.catho} QueroVagasTech:${fontes.querovagastech}`);

  // Integração com banco de dados (Neon via Prisma)
  try {
    // 1. Limpeza de vagas com mais de 30 dias
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    await prisma.vaga.deleteMany({
      where: {
        createdAt: {
          lt: trintaDiasAtras,
        },
      },
    });

    // 2. IA de Classificação (Gemini) para novas vagas
    const apiKey = process.env.GEMINI_API_KEY;
    const linksUnicos = unicas.map(v => v.link).filter(Boolean);
    const vagasDb = await prisma.vaga.findMany({
      where: { link: { in: linksUnicos } },
      select: { link: true, isTI: true }
    });
    const vagasExistentesMap = new Map(vagasDb.map(v => [v.link, v.isTI]));
    const novasParaIA = unicas.filter(v => v.link && !vagasExistentesMap.has(v.link));

    if (novasParaIA.length > 0 && apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
        // Manda em lotes de até 100 para não estourar tokens
        const lotes = [];
        for (let i = 0; i < novasParaIA.length; i += 100) {
          lotes.push(novasParaIA.slice(i, i + 100));
        }

        for (const lote of lotes) {
          const listaTitulos = lote.map((v, i) => `${i}::${v.titulo}::${v.empresa}`).join('\n');
          const prompt = `Analise a lista de vagas abaixo no formato "ID::Titulo::Empresa".
Retorne um array JSON contendo TODAS as vagas enviadas. Para cada vaga, defina o "id" (número), "isTI" (booleano true/false se é especificamente de Tecnologia da Informação/Desenvolvimento) e "competencias" (array de strings com as tecnologias, ferramentas ou skills principais detectadas, independentemente da área).
Exemplo de retorno: [{"id": 0, "isTI": true, "competencias": ["Java", "Spring"]}, {"id": 3, "isTI": false, "competencias": ["Química", "Laboratório", "HPLC"]}]
Lista de vagas:
${listaTitulos}`;
          
          const result = await model.generateContent(prompt);
          let text = result.response.text().trim();
          if (text.startsWith('```json')) text = text.replace(/```json|```/g, '').trim();
          if (text.startsWith('```')) text = text.replace(/```/g, '').trim();
          
          let vagasFiltradas = [];
          try {
            vagasFiltradas = JSON.parse(text);
          } catch (e) { console.error('Erro de parse:', e, text); }
          
          const mapClassificadas = new Map(vagasFiltradas.map(v => [v.id, v]));

          for (let i = 0; i < lote.length; i++) {
            const cls = mapClassificadas.get(i);
            if (cls) {
              lote[i].isTI = cls.isTI || false;
              lote[i].competencias = cls.competencias || [];
            } else {
              lote[i].isTI = false;
              lote[i].competencias = [];
            }
          }
        }
        console.log(`[ia] Classificadas ${novasParaIA.length} vagas usando Gemini.`);

        // 2.1 Notificações do Telegram para novas vagas de TI
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        const novasTI = novasParaIA.filter(v => v.isTI);
        if (botToken && chatId && novasTI.length > 0) {
          try {
            const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
            const resumo = `🚨 *${novasTI.length} novas vagas de TI encontradas!*\n\n${novasTI.slice(0, 15).map(v => `• [${v.titulo}](${v.link}) - ${v.empresa}`).join('\n')}`;
            await axios.post(telegramUrl, {
              chat_id: chatId,
              text: resumo,
              parse_mode: 'Markdown',
              disable_web_page_preview: true
            });
            console.log(`[telegram] Notificação enviada sobre ${novasTI.length} vagas de TI.`);
          } catch (err) {
            console.error('[telegram] Erro ao enviar notificação:', err.message);
          }
        }

        // 2.2 Notificações por E-mail (Nodemailer)
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;
        if (emailUser && emailPass && novasTI.length > 0) {
          try {
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: { user: emailUser, pass: emailPass }
            });
            
            const htmlVagas = novasTI.map(v => `
              <div style="background: #ffffff; border: 1px solid #eaeaea; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <h3 style="margin: 0 0 8px; font-size: 18px; color: #111;">${v.titulo}</h3>
                <p style="margin: 0 0 4px; font-size: 14px; color: #444;"><strong>Empresa:</strong> ${v.empresa}</p>
                <p style="margin: 0 0 16px; font-size: 14px; color: #666;"><strong>Local:</strong> ${v.local} • <strong>Fonte:</strong> ${v.fonte}</p>
                <a href="${v.link}" style="background: #000; color: #fff; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Ver Detalhes e Candidatar-se</a>
              </div>
            `).join('');

            const emailHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; padding: 24px; color: #111;">
                <div style="max-width: 600px; margin: 0 auto;">
                  <h2 style="font-size: 24px; margin-bottom: 8px;">🚀 Novas Vagas de TI Encontradas</h2>
                  <p style="color: #666; margin-bottom: 24px; font-size: 16px;">O seu radar encontrou <strong>${novasTI.length}</strong> novas oportunidades na área de TI hoje. Confira abaixo:</p>
                  
                  ${htmlVagas}
                  
                  <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eaeaea;">
                    <p style="color: #888; font-size: 12px;">Este é um alerta automático do seu buscador de vagas.</p>
                  </div>
                </div>
              </div>
            `;

            await transporter.sendMail({
              from: '"Radar de Vagas TI" <' + emailUser + '>',
              to: emailUser,
              subject: '🚨 ' + novasTI.length + ' Novas Vagas de TI!',
              html: emailHtml
            });
            console.log('[email] Notificação enviada para ' + emailUser + '.');
          } catch (err) {
            console.error('[email] Erro ao enviar e-mail:', err.message);
          }
        }
      } catch (err) {
        console.error('[ia] Erro ao classificar em lote:', err.message);
      }
    }

    // 3. Salvar ou atualizar as vagas encontradas
    for (const v of unicas) {
      if (!v.link) continue;
      
      const isTIPersist = v.isTI !== undefined ? v.isTI : (vagasExistentesMap.has(v.link) ? vagasExistentesMap.get(v.link) : true);

      await prisma.vaga.upsert({
        where: { link: v.link },
        update: {
          titulo: v.titulo,
          empresa: v.empresa,
          local: v.local,
          data: v.data || null,
          ...(v.competencias ? { competencias: v.competencias } : {})
        },
        create: {
          titulo: v.titulo,
          empresa: v.empresa,
          local: v.local,
          data: v.data || null,
          link: v.link,
          termo: v.termo || 'geral',
          fonte: v.fonte,
          isTI: isTIPersist,
          competencias: v.competencias || []
        },
      });
    }
  } catch (err) {
    console.error('[db] Erro ao gravar vagas no banco:', err.message);
  }

  return { gerado_em: new Date().toISOString(), total: unicas.length, fontes, vagas: unicas, cached: false };
}

export async function GET(req) {
  const forceRefresh = new URL(req.url).searchParams.has('refresh');

  try {
    // 1. Retornar vagas que já estão no banco para rapidez imediata
    const vagasDb = await prisma.vaga.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Se o banco estiver vazio ou o usuário forçou o refresh, buscar nas fontes agora mesmo
    if (vagasDb.length === 0 || forceRefresh) {
      const dados = await buildData();
      return NextResponse.json(dados);
    }

    // Calcular estatísticas com base no que está no banco
    const fontes = {
      linkedin:       vagasDb.filter(v => v.fonte === 'linkedin').length,
      vagasbauru:     vagasDb.filter(v => v.fonte === 'vagasbauru').length,
      indeed:         vagasDb.filter(v => v.fonte === 'indeed').length,
      vagascom:       vagasDb.filter(v => v.fonte === 'vagascom').length,
      ciee:           vagasDb.filter(v => v.fonte === 'ciee').length,
      catho:          vagasDb.filter(v => v.fonte === 'catho').length,
      empregoscom:    vagasDb.filter(v => v.fonte === 'empregoscom').length,
      querovagastech: vagasDb.filter(v => v.fonte === 'querovagastech').length,
    };

    const payload = {
      gerado_em: new Date().toISOString(),
      total: vagasDb.length,
      fontes,
      vagas: vagasDb,
      cached: true
    };

    // Atualização em background (simples, sempre que consultar dispara se não tiver refresh recente em memória)
    // Para simplificar, vou confiar no uso prático do usuário de que se houver acesso será retornado o que está no banco, 
    // e caso queira forçar a busca, basta enviar '?refresh=1'.
    // Mas se quiser que atualize, vou disparar o buildData sem aguardar, para popular para as próximas requisições.
    if (!refreshing) {
      refreshing = true;
      buildData()
        .then(() => { console.log('[bg] Banco de dados atualizado com novas vagas.'); })
        .catch(e => console.error('[cache] erro no refresh background:', e))
        .finally(() => { refreshing = false; });
    }

    return NextResponse.json(payload);
  } catch (err) {
    console.error('Erro geral no GET /api/vagas:', err.message);
    return NextResponse.json({ error: 'Erro interno ao consultar vagas.' }, { status: 500 });
  }
}
