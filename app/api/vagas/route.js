import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const HEADERS_HTML = { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9', Accept: 'text/html,*/*;q=0.8' };
const HEADERS_JSON = { 'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9', Accept: 'application/json' };

const CIDADES = ['bauru', 'agudos', 'lençóis', 'lencois', 'botucatu', 'jaú', 'jau', 'pederneiras'];

// Palavras-chave para identificar vagas de TI no VagasBauru (que é geral)
const KEYWORDS_TI = /desenvolv|programad|software|tecnologia|inform[aá]tic|analista\s+de\s+(sistemas|dados|ti|suporte|bi)|devops|cloud|infra(estrutura)?|suporte\s+(t[eé]c|ti)|helpdesk|help\s+desk|banco\s+de\s+dados|\bdba\b|seguran[cç]a\s+da\s+informa|ciberseguran|quality\s+assurance|\bqa\b|engenheiro\s+(de\s+)?(software|dados|sistemas|cloud)|rede\s+(de\s+)?comput|ti\s+|techn|power\s*bi|business\s+intelligence|\bpowerbi\b|data\s+(analyst|engineer|scientist)|machine\s+learning|\bml\b\s+engineer/i;

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
      params: { limit: 200 },
      headers: HEADERS_JSON,
      timeout: 10000,
    });
    const jobs = resp.data?.dados || [];
    for (const job of jobs) {
      const titulo = job.titulo || 'Vaga';
      if (!KEYWORDS_TI.test(titulo)) continue;

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

const TERMOS_INDEED = ['desenvolvedor TI', 'programador', 'analista sistemas', 'suporte técnico'];

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
  const termos = ['desenvolvedor', 'programador', 'analista+de+sistemas', 'suporte+tecnico', 'ti'];
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
  const termos = ['desenvolvedor', 'programador', 'suporte-tecnico', 'analista-sistemas'];
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
        if (titulo && href && KEYWORDS_TI.test(titulo)) {
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

const TERMOS_CATHO = ['desenvolvedor', 'programador', 'analista+de+sistemas', 'suporte+tecnico', 'ti'];

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
  return todas.filter(v => KEYWORDS_TI.test(v.titulo));
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

// ─── Cache com stale-while-revalidate ────────────────────────────────────────

let cacheData = null;
let cacheTs   = 0;
let refreshing = false;

const TTL_FRESCO  = 5  * 60 * 1000; // 5 min: serve direto do cache, sem refresh
const TTL_VALIDO  = 15 * 60 * 1000; // 15 min: serve cache mas atualiza em background

async function buildData() {
  const [linkedin, vagasbauru, indeed, vagascom, ciee, catho, empregoscom] = await Promise.allSettled([
    fetchLinkedIn(),
    fetchVagasBauru(),
    fetchIndeed(),
    fetchVagasCom(),
    fetchCIEE(),
    fetchCatho(),
    fetchEmpregosCom(),
  ]);

  const FONTES_LOCAIS = new Set(['vagasbauru', 'indeed', 'vagascom', 'ciee', 'catho', 'empregoscom']);

  const todas = [
    ...(linkedin.status    === 'fulfilled' ? linkedin.value    : []),
    ...(vagasbauru.status  === 'fulfilled' ? vagasbauru.value  : []),
    ...(indeed.status      === 'fulfilled' ? indeed.value      : []),
    ...(vagascom.status    === 'fulfilled' ? vagascom.value    : []),
    ...(ciee.status        === 'fulfilled' ? ciee.value        : []),
    ...(catho.status       === 'fulfilled' ? catho.value       : []),
    ...(empregoscom.status === 'fulfilled' ? empregoscom.value : []),
  ].filter(v => naRegiao(v.local) || !v.local || v.local === 'N/A' || FONTES_LOCAIS.has(v.fonte));

  // Deduplicar por link
  const vistas = new Set();
  const unicas = todas.filter(v => {
    if (!v.link || vistas.has(v.link)) return false;
    vistas.add(v.link);
    return true;
  });

  const fontes = {
    linkedin:    unicas.filter(v => v.fonte === 'linkedin').length,
    vagasbauru:  unicas.filter(v => v.fonte === 'vagasbauru').length,
    indeed:      unicas.filter(v => v.fonte === 'indeed').length,
    vagascom:    unicas.filter(v => v.fonte === 'vagascom').length,
    ciee:        unicas.filter(v => v.fonte === 'ciee').length,
    catho:       unicas.filter(v => v.fonte === 'catho').length,
    empregoscom: unicas.filter(v => v.fonte === 'empregoscom').length,
  };

  console.log(`[vagas] ${unicas.length} únicas | LinkedIn:${fontes.linkedin} VagasBauru:${fontes.vagasbauru} Indeed:${fontes.indeed} Vagas.com:${fontes.vagascom} CIEE:${fontes.ciee} Catho:${fontes.catho} Empregos.com:${fontes.empregoscom}`);

  return { gerado_em: new Date().toISOString(), total: unicas.length, fontes, vagas: unicas, cached: false };
}

export async function GET(req) {
  const forceRefresh = new URL(req.url).searchParams.has('refresh');
  const agora = Date.now();

  // Cache fresco e sem force: retorna imediatamente
  if (!forceRefresh && cacheData && agora - cacheTs < TTL_FRESCO) {
    return NextResponse.json({ ...cacheData, cached: true });
  }

  // Cache ainda válido (mas stale): retorna cache e atualiza em background
  if (!forceRefresh && cacheData && agora - cacheTs < TTL_VALIDO && !refreshing) {
    refreshing = true;
    buildData().then(d => {
      cacheData = d;
      cacheTs = Date.now();
    }).catch(e => console.error('[cache] erro no refresh background:', e))
      .finally(() => { refreshing = false; });
    return NextResponse.json({ ...cacheData, cached: true });
  }

  // Cache expirado ou force: espera os dados frescos
  const dados = await buildData();
  cacheData = dados;
  cacheTs = Date.now();
  return NextResponse.json(dados);
}
