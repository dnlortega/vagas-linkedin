// API de scraping de vagas em Bauru — LinkedIn, VagasBauru, Indeed, Vagas.com, Catho, CIEE, Empregos.com
// Criado por Daniel Ortega Pereira
// https://github.com/dnlortega/vagas-linkedin

import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const HEADERS_HTML = { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9', Accept: 'text/html,*/*;q=0.8' };
const HEADERS_JSON = { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9', Accept: 'application/json' };

const CIDADES = ['bauru'];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function naRegiao(local) {
  const l = (local || '').toLowerCase();
  return CIDADES.some(c => l.includes(c)) || l.includes('remot') || l.includes('híbrid') || l.includes('hibrido');
}

// ─── LinkedIn ────────────────────────────────────────────────────────────────

const TERMOS_LINKEDIN = [
  'desenvolvedor',        'programador',          'suporte técnico',
  'devops',               'engenheiro software',  'analista de sistemas',
  'QA testes',            'segurança da informação', 'cloud computing',
  'banco de dados',       'data science',         'infraestrutura TI',
  'ti bauru',             'power bi',             'analista de dados',
  'suporte de TI',        'DBA',
];

async function linkedinPagina(keyword, start) {
  const resp = await axios.get(
    'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search',
    {
      params: { keywords: keyword, location: 'Bauru, São Paulo, Brasil', start, count: 25 },
      headers: HEADERS_HTML,
      timeout: 12000,
    }
  );
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
      const resp = await axios.get('https://br.indeed.com/empregos', {
        params: { q: termo, l: 'Bauru, SP', fromage: 30, sort: 'date' },
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
      const resp = await axios.get(`https://www.vagas.com.br/vagas-de-${termo}-em-bauru-sp`, {
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
      const resp = await axios.get('https://www.catho.com.br/vagas/', {
        params: { q: termo, l: 'bauru-sp' },
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
  const [linkedin, vagasbauru, indeed, vagascom, ciee, catho, empregoscom, querovagastech, agilebauru, programathor, infojobs] = await Promise.allSettled([
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
  ]);

  const FONTES_LOCAIS = new Set(['vagasbauru', 'indeed', 'vagascom', 'ciee', 'catho', 'empregoscom', 'querovagastech', 'agilebauru', 'programathor', 'infojobs']);

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
  };

  console.log(`[vagas] ${unicas.length} únicas | LinkedIn:${fontes.linkedin} VagasBauru:${fontes.vagasbauru} Indeed:${fontes.indeed} Vagas.com:${fontes.vagascom} CIEE:${fontes.ciee} Catho:${fontes.catho} Empregos.com:${fontes.empregoscom} QueroVagasTech:${fontes.querovagastech}`);

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

    // 2. Salvar ou atualizar as vagas encontradas
    for (const v of unicas) {
      if (!v.link) continue;
      await prisma.vaga.upsert({
        where: { link: v.link },
        update: {
          titulo: v.titulo,
          empresa: v.empresa,
          local: v.local,
          data: v.data || null,
        },
        create: {
          titulo: v.titulo,
          empresa: v.empresa,
          local: v.local,
          data: v.data || null,
          link: v.link,
          termo: v.termo || 'geral',
          fonte: v.fonte,
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
