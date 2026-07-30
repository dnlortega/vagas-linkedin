export const CIDADES = ['agudos', 'bauru', 'botucatu', 'jau', 'jaú', 'lencois', 'lençóis', 'pederneiras'];
export const LS_KEY      = 'vagas_ids_vistos';
export const LS_FAV      = 'vagas_favoritas';
export const LS_KANBAN   = 'vagas_kanban';
export const LS_OCULTAS  = 'vagas_ocultas';
export const LS_HISTORICO = 'vagas_historico_busca';
export const LS_VISITADAS = 'vagas_visitadas';
export const AUTO_REFRESH_MS = 10 * 60 * 1000;

export const PERIODOS = [
  { id: 'todos', label: 'Qualquer data', dias: null },
  { id: '24h',   label: 'Últimas 24h',  dias: 1    },
  { id: '7d',    label: 'Última semana', dias: 7   },
  { id: '30d',   label: 'Último mês',   dias: 30   },
  { id: '90d',   label: '3 meses',      dias: 90   },
];

export const FONTE_CONFIG = {
  linkedin:       { label: 'LinkedIn',       color: 'bg-blue-100 text-blue-700 border-blue-200',      accent: '#3b82f6' },
  vagasbauru:     { label: 'VagasBauru',     color: 'bg-rose-100 text-rose-700 border-rose-200',      accent: '#f43f5e' },
  indeed:         { label: 'Indeed',         color: 'bg-sky-100 text-sky-700 border-sky-200',          accent: '#0ea5e9' },
  vagascom:       { label: 'Vagas.com',      color: 'bg-amber-100 text-amber-700 border-amber-200',   accent: '#f59e0b' },
  ciee:           { label: 'CIEE',           color: 'bg-teal-100 text-teal-700 border-teal-200',      accent: '#14b8a6' },
  catho:          { label: 'Catho',          color: 'bg-orange-100 text-orange-700 border-orange-200',accent: '#f97316' },
  empregoscom:    { label: 'Empregos',       color: 'bg-lime-100 text-lime-700 border-lime-200',      accent: '#84cc16' },
  querovagastech: { label: 'QueroVagas',     color: 'bg-violet-100 text-violet-700 border-violet-200',accent: '#8b5cf6' },
};

export const LOCALIDADE_CONFIG = {
  bauru:  { label: 'Bauru',  accent: '#3b82f6', badge: 'bg-blue-50 text-blue-700 border border-blue-200'          },
  regiao: { label: 'Região', accent: '#6366f1', badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200'    },
  remoto: { label: 'Remoto', accent: '#10b981', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  outro:  { label: '',       accent: '#94a3b8', badge: ''                                                         },
};

export const favicon = d => `https://www.google.com/s2/favicons?domain=${d}&sz=32`;

export const PLATAFORMAS = [
  { id: 'linkedin',    label: 'LinkedIn',    url: 'https://www.linkedin.com/jobs/search/?keywords=desenvolvedor+TI&location=Bauru%2C+S%C3%A3o+Paulo%2C+Brasil&sortBy=DD', faviconUrl: favicon('linkedin.com')       },
  { id: 'vagasbauru', label: 'VagasBauru',  url: 'https://vagasbauru.com.br/vagas?q=ti',                                                                                  faviconUrl: favicon('vagasbauru.com.br')  },
  { id: 'gupy',       label: 'Gupy',        url: 'https://portal.gupy.io/job-search?sortBy=publishedDate&sortOrder=desc&term=TI&state=S%C3%A3o%20Paulo&city[]=Bauru',     faviconUrl: favicon('gupy.io')            },
  { id: 'solides',    label: 'Solides',     url: 'https://vagas.solides.com.br/vagas/bauru-sp/ti',                                                                        faviconUrl: favicon('solides.com.br')     },
  { id: 'talentbrand',label: 'TalentBrand', url: 'https://app.talentbrand.com.br/vagas?cidade=Bauru&estado=SP',                                                           faviconUrl: favicon('talentbrand.com.br') },
  { id: 'indeed',     label: 'Indeed',      url: 'https://br.indeed.com/empregos?q=desenvolvedor+TI&l=Bauru%2C+SP&sort=date',                                             faviconUrl: favicon('indeed.com')         },
  { id: 'vagascom',   label: 'Vagas.com',   url: 'https://www.vagas.com.br/vagas-de-ti-em-bauru-sp',                                                                      faviconUrl: favicon('vagas.com.br')       },
  { id: 'ciee',       label: 'CIEE',        url: 'https://portal.ciee.org.br/vagas/estagio-e-aprendiz/?estado=SP&cidade=Bauru&area=tecnologia-da-informacao',             faviconUrl: favicon('ciee.org.br')   },
  { id: 'catho',      label: 'Catho',       url: 'https://www.catho.com.br/vagas/?q=desenvolvedor+ti&l=bauru-sp',                                                                   faviconUrl: favicon('catho.com.br')       },
  { id: 'empregos',      label: 'Empregos',       url: 'https://www.empregos.com.br/empregos/desenvolvedor/bauru-sp',                                                                     faviconUrl: favicon('empregos.com.br')         },
  { id: 'querovagastech', label: 'QueroVagas Tech', url: 'https://www.querovagastech.com.br/',                                                                                               faviconUrl: favicon('querovagastech.com.br')   },
];

export const TECHS = [
  { label: '.NET/C#',    regex: /\bc#\b|\.net\b/i,                     color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { label: 'Angular',    regex: /\bangular\b/i,                        color: 'bg-red-100 text-red-700 border-red-200'          },
  { label: 'AWS',        regex: /\baws\b|\bamazon web\b/i,             color: 'bg-amber-100 text-amber-700 border-amber-200'    },
  { label: 'DevOps',     regex: /\bdevops\b/i,                         color: 'bg-rose-100 text-rose-700 border-rose-200'       },
  { label: 'Docker',     regex: /\bdocker\b|\bkubernetes\b|\bk8s\b/i,  color: 'bg-sky-100 text-sky-700 border-sky-200'         },
  { label: 'Flutter',    regex: /\bflutter\b|\bdart\b/i,               color: 'bg-cyan-100 text-cyan-600 border-cyan-200'       },
  { label: 'Java',       regex: /\bjava\b(?!script)/i,                 color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { label: 'JavaScript', regex: /\bjavascript\b|\bjs\b/i,              color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { label: 'Kotlin',     regex: /\bkotlin\b|\bandroid\b/i,             color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { label: 'Node.js',    regex: /\bnode\.?js\b/i,                      color: 'bg-green-100 text-green-600 border-green-200'    },
  { label: 'PHP',        regex: /\bphp\b/i,                            color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { label: 'Power BI',   regex: /power\s*bi|\bpowerbi\b/i,             color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { label: 'Python',     regex: /\bpython\b/i,                         color: 'bg-blue-100 text-blue-700 border-blue-200'       },
  { label: 'React',      regex: /\breact\b/i,                          color: 'bg-cyan-100 text-cyan-700 border-cyan-200'       },
  { label: 'SQL',        regex: /\bsql\b|\bmysql\b|\bpostgres\b/i,     color: 'bg-slate-100 text-slate-700 border-slate-200'    },
  { label: 'TypeScript', regex: /\btypescript\b|\bts\b/i,              color: 'bg-blue-100 text-blue-600 border-blue-200'       },
  { label: 'Vue',        regex: /\bvue\.?js\b/i,                       color: 'bg-green-100 text-green-700 border-green-200'    },
];

export function detectarTechs(titulo) { return TECHS.filter(t => t.regex.test(titulo)); }

export function detectarModalidade(titulo) {
  const t = (titulo || '').toLowerCase();
  if (/estagi[oá]|estagiário|estagiaria/.test(t)) return 'estagio';
  if (/trainee|aprendiz/.test(t)) return 'trainee';
  if (/\bpj\b|pessoa jur/.test(t)) return 'pj';
  if (/\bclt\b/.test(t)) return 'clt';
  return null;
}

export function detectarModoTrabalho(local, titulo) {
  const t = `${local || ''} ${titulo || ''}`.toLowerCase();
  if (/remot[oa]/.test(t)) return 'remoto';
  if (/h[ií]brid[oa]/.test(t)) return 'hibrido';
  if (/presencial/.test(t)) return 'presencial';
  return null;
}

export function matchBusca(vaga, busca) {
  if (!busca.trim()) return true;
  const texto = `${vaga.titulo} ${vaga.empresa}`.toLowerCase();
  
  // Divide a busca por vírgulas (OR)
  const grupos = busca.toLowerCase().split(',').map(g => g.trim()).filter(Boolean);
  
  if (grupos.length === 0) return true;

  // Retorna true se a vaga bater com QUALQUER UM dos grupos (OR)
  return grupos.some(grupo => {
    // Dentro do grupo, os espaços atuam como AND
    return grupo.split(/\s+/).every(t =>
      t.startsWith('-') && t.length > 1 ? !texto.includes(t.slice(1)) : texto.includes(t)
    );
  });
}

export function tipoLocalidade(local) {
  const l = (local || '').toLowerCase();
  if (l.includes('bauru')) return 'bauru';
  if (CIDADES.some(c => l.includes(c))) return 'regiao';
  if (l.includes('remot') || l.includes('híbrid') || l.includes('hibrido')) return 'remoto';
  return 'outro';
}

export function formatData(data) {
  if (!data) return null;
  const diff = Math.floor((Date.now() - new Date(data)) / 86400000);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff < 7)  return `há ${diff} dias`;
  if (diff < 30) return `há ${Math.floor(diff / 7)} sem.`;
  if (diff < 365) return `há ${Math.floor(diff / 30)} mês.`;
  return `há ${Math.floor(diff / 365)} ano(s)`;
}

export function matchPeriodo(data, periodoId) {
  if (periodoId === 'todos') return true;
  const p = PERIODOS.find(p => p.id === periodoId);
  if (!p?.dias || !data) return true;
  return (Date.now() - new Date(data)) / 86400000 <= p.dias;
}

export function detectSenioridade(titulo) {
  const t = (titulo || '').toLowerCase();
  if (/\bjunior\b|\bjr\.?\b|\biniciante\b|\bestagiário\b|\bestagio\b|\btrainee\b/.test(t)) return 'junior';
  if (/\bsenior\b|\bsr\.?\b|\bsênior\b/.test(t)) return 'senior';
  if (/\bpleno\b|\bpl\.?\b|\bmid[- ]?level\b/.test(t)) return 'pleno';
  return null;
}

export function iniciais(empresa) {
  if (!empresa || empresa === 'N/A') return '?';
  return empresa.split(/\s+/).filter(w => w.length > 2).slice(0, 2).map(w => w[0].toUpperCase()).join('')
      || empresa[0].toUpperCase();
}

export function formatTempo(date) {
  if (!date) return null;
  const diff = Math.floor((Date.now() - new Date(date)) / 60000);
  if (diff < 1)  return 'agora mesmo';
  if (diff < 60) return `há ${diff} min`;
  return `há ${Math.floor(diff / 60)}h`;
}
