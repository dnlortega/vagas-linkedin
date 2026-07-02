// Sistema de Vagas de TI em Bauru
// Criado por Daniel Ortega Pereira
// https://github.com/dnlortega/vagas-linkedin

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  SearchIcon, RefreshCwIcon, MapPinIcon, CalendarIcon, BriefcaseIcon,
  BellIcon, HeartIcon, KanbanIcon, BarChart2Icon, MoonIcon, SunIcon,
  DownloadIcon, ArrowUpDownIcon, EyeOffIcon, ListIcon, LayoutGridIcon,
  BellOffIcon, XIcon, ClockIcon, SparklesIcon, ChevronRightIcon,
  FilterXIcon, MonitorIcon, WifiIcon, CarIcon,
  HistoryIcon, TrophyIcon, ChevronUpIcon,
  BookmarkIcon, LayersIcon, Building2Icon, AwardIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import VagaModal from './components/VagaModal';

// ─── Constantes ──────────────────────────────────────────────────────────────

const CIDADES = ['bauru', 'agudos', 'lençóis', 'lencois', 'botucatu', 'jaú', 'jau', 'pederneiras'];
const LS_KEY      = 'vagas_ids_vistos';
const LS_FAV      = 'vagas_favoritas';
const LS_KANBAN   = 'vagas_kanban';
const LS_OCULTAS  = 'vagas_ocultas';
const LS_HISTORICO = 'vagas_historico_busca';
const LS_VISITADAS = 'vagas_visitadas';
const AUTO_REFRESH_MS = 10 * 60 * 1000;

const PERIODOS = [
  { id: 'todos', label: 'Qualquer data', dias: null },
  { id: '24h',   label: 'Últimas 24h',  dias: 1    },
  { id: '7d',    label: 'Última semana', dias: 7   },
  { id: '30d',   label: 'Último mês',   dias: 30   },
  { id: '90d',   label: '3 meses',      dias: 90   },
];

const FONTE_CONFIG = {
  linkedin:    { label: 'LinkedIn',   color: 'bg-blue-100 text-blue-700 border-blue-200',      accent: '#3b82f6' },
  vagasbauru:  { label: 'VagasBauru', color: 'bg-rose-100 text-rose-700 border-rose-200',      accent: '#f43f5e' },
  indeed:      { label: 'Indeed',     color: 'bg-sky-100 text-sky-700 border-sky-200',          accent: '#0ea5e9' },
  vagascom:    { label: 'Vagas.com',  color: 'bg-amber-100 text-amber-700 border-amber-200',   accent: '#f59e0b' },
  ciee:        { label: 'CIEE',       color: 'bg-teal-100 text-teal-700 border-teal-200',      accent: '#14b8a6' },
  catho:       { label: 'Catho',      color: 'bg-orange-100 text-orange-700 border-orange-200',accent: '#f97316' },
  empregoscom: { label: 'Empregos',   color: 'bg-lime-100 text-lime-700 border-lime-200',      accent: '#84cc16' },
};

const LOCALIDADE_CONFIG = {
  bauru:  { label: 'Bauru',  accent: '#3b82f6', badge: 'bg-blue-50 text-blue-700 border border-blue-200'          },
  regiao: { label: 'Região', accent: '#6366f1', badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200'    },
  remoto: { label: 'Remoto', accent: '#10b981', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  outro:  { label: '',       accent: '#94a3b8', badge: ''                                                         },
};

const favicon = d => `https://www.google.com/s2/favicons?domain=${d}&sz=32`;

const PLATAFORMAS = [
  { id: 'linkedin',    label: 'LinkedIn',    url: 'https://www.linkedin.com/jobs/search/?keywords=desenvolvedor+TI&location=Bauru%2C+S%C3%A3o+Paulo%2C+Brasil&sortBy=DD', faviconUrl: favicon('linkedin.com')       },
  { id: 'vagasbauru', label: 'VagasBauru',  url: 'https://vagasbauru.com.br/vagas?q=ti',                                                                                  faviconUrl: favicon('vagasbauru.com.br')  },
  { id: 'gupy',       label: 'Gupy',        url: 'https://portal.gupy.io/job-search?sortBy=publishedDate&sortOrder=desc&term=TI&state=S%C3%A3o%20Paulo&city[]=Bauru',     faviconUrl: favicon('gupy.io')            },
  { id: 'solides',    label: 'Solides',     url: 'https://vagas.solides.com.br/vagas/bauru-sp/ti',                                                                        faviconUrl: favicon('solides.com.br')     },
  { id: 'talentbrand',label: 'TalentBrand', url: 'https://app.talentbrand.com.br/vagas?cidade=Bauru&estado=SP',                                                           faviconUrl: favicon('talentbrand.com.br') },
  { id: 'indeed',     label: 'Indeed',      url: 'https://br.indeed.com/empregos?q=desenvolvedor+TI&l=Bauru%2C+SP&sort=date',                                             faviconUrl: favicon('indeed.com')         },
  { id: 'vagascom',   label: 'Vagas.com',   url: 'https://www.vagas.com.br/vagas-de-ti-em-bauru-sp',                                                                      faviconUrl: favicon('vagas.com.br')       },
  { id: 'ciee',       label: 'CIEE',        url: 'https://portal.ciee.org.br/vagas/estagio-e-aprendiz/?estado=SP&cidade=Bauru&area=tecnologia-da-informacao',             faviconUrl: favicon('ciee.org.br')   },
  { id: 'catho',      label: 'Catho',       url: 'https://www.catho.com.br/vagas/?q=desenvolvedor+ti&l=bauru-sp',                                                                   faviconUrl: favicon('catho.com.br')       },
  { id: 'empregos',  label: 'Empregos',    url: 'https://www.empregos.com.br/empregos/desenvolvedor/bauru-sp',                                                                     faviconUrl: favicon('empregos.com.br')    },
];

const TECHS = [
  { label: 'React',      regex: /\breact\b/i,                          color: 'bg-cyan-100 text-cyan-700 border-cyan-200'       },
  { label: 'Vue',        regex: /\bvue\.?js\b/i,                       color: 'bg-green-100 text-green-700 border-green-200'    },
  { label: 'Angular',    regex: /\bangular\b/i,                        color: 'bg-red-100 text-red-700 border-red-200'          },
  { label: 'Node.js',    regex: /\bnode\.?js\b/i,                      color: 'bg-green-100 text-green-600 border-green-200'    },
  { label: 'Python',     regex: /\bpython\b/i,                         color: 'bg-blue-100 text-blue-700 border-blue-200'       },
  { label: 'Java',       regex: /\bjava\b(?!script)/i,                 color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { label: 'JavaScript', regex: /\bjavascript\b|\bjs\b/i,              color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { label: 'TypeScript', regex: /\btypescript\b|\bts\b/i,              color: 'bg-blue-100 text-blue-600 border-blue-200'       },
  { label: 'PHP',        regex: /\bphp\b/i,                            color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { label: '.NET/C#',    regex: /\bc#\b|\.net\b/i,                     color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { label: 'SQL',        regex: /\bsql\b|\bmysql\b|\bpostgres\b/i,     color: 'bg-slate-100 text-slate-700 border-slate-200'    },
  { label: 'Power BI',   regex: /power\s*bi|\bpowerbi\b/i,             color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { label: 'AWS',        regex: /\baws\b|\bamazon web\b/i,             color: 'bg-amber-100 text-amber-700 border-amber-200'    },
  { label: 'Docker',     regex: /\bdocker\b|\bkubernetes\b|\bk8s\b/i,  color: 'bg-sky-100 text-sky-700 border-sky-200'         },
  { label: 'DevOps',     regex: /\bdevops\b/i,                         color: 'bg-rose-100 text-rose-700 border-rose-200'       },
  { label: 'Flutter',    regex: /\bflutter\b|\bdart\b/i,               color: 'bg-cyan-100 text-cyan-600 border-cyan-200'       },
  { label: 'Kotlin',     regex: /\bkotlin\b|\bandroid\b/i,             color: 'bg-violet-100 text-violet-700 border-violet-200' },
];

// ─── Debounce hook ───────────────────────────────────────────────────────────

function useDebounce(value, delay = 200) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectarTechs(titulo) { return TECHS.filter(t => t.regex.test(titulo)); }

function detectarModalidade(titulo) {
  const t = (titulo || '').toLowerCase();
  if (/estagi[oá]|estagiário|estagiaria/.test(t)) return 'estagio';
  if (/trainee|aprendiz/.test(t)) return 'trainee';
  if (/\bpj\b|pessoa jur/.test(t)) return 'pj';
  if (/\bclt\b/.test(t)) return 'clt';
  return null;
}

function detectarModoTrabalho(local, titulo) {
  const t = `${local || ''} ${titulo || ''}`.toLowerCase();
  if (/remot[oa]/.test(t)) return 'remoto';
  if (/h[ií]brid[oa]/.test(t)) return 'hibrido';
  if (/presencial/.test(t)) return 'presencial';
  return null;
}

function matchBusca(vaga, busca) {
  if (!busca.trim()) return true;
  const texto = `${vaga.titulo} ${vaga.empresa}`.toLowerCase();
  return busca.toLowerCase().trim().split(/\s+/).every(t =>
    t.startsWith('-') && t.length > 1 ? !texto.includes(t.slice(1)) : texto.includes(t)
  );
}

function tipoLocalidade(local) {
  const l = (local || '').toLowerCase();
  if (l.includes('bauru')) return 'bauru';
  if (CIDADES.some(c => l.includes(c))) return 'regiao';
  if (l.includes('remot') || l.includes('híbrid') || l.includes('hibrido')) return 'remoto';
  return 'outro';
}

function formatData(data) {
  if (!data) return null;
  const diff = Math.floor((Date.now() - new Date(data)) / 86400000);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff < 7)  return `há ${diff} dias`;
  if (diff < 30) return `há ${Math.floor(diff / 7)} sem.`;
  if (diff < 365) return `há ${Math.floor(diff / 30)} mês.`;
  return `há ${Math.floor(diff / 365)} ano(s)`;
}

function matchPeriodo(data, periodoId) {
  if (periodoId === 'todos') return true;
  const p = PERIODOS.find(p => p.id === periodoId);
  if (!p?.dias || !data) return true;
  return (Date.now() - new Date(data)) / 86400000 <= p.dias;
}

function detectSenioridade(titulo) {
  const t = (titulo || '').toLowerCase();
  if (/\bjunior\b|\bjr\.?\b|\biniciante\b|\bestagiário\b|\bestagio\b|\btrainee\b/.test(t)) return 'junior';
  if (/\bsenior\b|\bsr\.?\b|\bsênior\b/.test(t)) return 'senior';
  if (/\bpleno\b|\bpl\.?\b|\bmid[- ]?level\b/.test(t)) return 'pleno';
  return null;
}

function iniciais(empresa) {
  if (!empresa || empresa === 'N/A') return '?';
  return empresa.split(/\s+/).filter(w => w.length > 2).slice(0, 2).map(w => w[0].toUpperCase()).join('')
      || empresa[0].toUpperCase();
}

function formatTempo(date) {
  if (!date) return null;
  const diff = Math.floor((Date.now() - new Date(date)) / 60000);
  if (diff < 1)  return 'agora mesmo';
  if (diff < 60) return `há ${diff} min`;
  return `há ${Math.floor(diff / 60)}h`;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const FONTES_LOADER = ['LinkedIn', 'VagasBauru', 'Indeed', 'Vagas.com', 'CIEE', 'Catho', 'Empregos'];

function CenteredLoader() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % FONTES_LOADER.length), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 fade-slide-up">
      {/* Ícone com pulse */}
      <div className="relative flex items-center justify-center">
        <div className="ping-slow absolute h-20 w-20 rounded-3xl bg-blue-400 opacity-30" />
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-blue-200 z-10">
          <BriefcaseIcon className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Texto e fonte ativa */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-lg font-bold text-gray-800">Buscando vagas de TI…</p>
        <p className="text-sm text-gray-400 h-5 transition-all">
          Verificando <span className="font-semibold text-blue-600">{FONTES_LOADER[dots]}</span>
        </p>
      </div>

      {/* Bolinhas por fonte */}
      <div className="flex gap-2">
        {FONTES_LOADER.map((src, i) => (
          <div
            key={src}
            className={`bounce-dot h-2 w-2 rounded-full transition-colors ${i === dots ? 'bg-blue-500' : 'bg-gray-200'}`}
            style={{ animationDelay: `${i * 100}ms` }}
            title={src}
          />
        ))}
      </div>
    </div>
  );
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    function onScroll() { setVisible(window.scrollY > 500); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 h-11 w-11 rounded-2xl bg-gray-900 text-white shadow-xl flex items-center justify-center hover:bg-blue-600 transition-all hover:scale-105 active:scale-95"
      title="Voltar ao topo"
    >
      <ChevronUpIcon className="h-5 w-5" />
    </button>
  );
}

function VagasPorDia({ vagas }) {
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso   = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short' });
    const count = vagas.filter(v => v.data?.startsWith(iso)).length;
    return { iso, label, count };
  });
  const max = Math.max(...dias.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-16">
      {dias.map(d => (
        <div key={d.iso} className="flex-1 flex flex-col items-center gap-1" title={`${d.label}: ${d.count} vagas`}>
          <span className="text-[9px] text-gray-400 font-semibold">{d.count || ''}</span>
          <div className="w-full bg-blue-500 rounded-sm transition-all" style={{ height: `${Math.max(3, (d.count / max) * 36)}px` }} />
          <span className="text-[9px] text-gray-400 capitalize">{d.label.replace('.', '')}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingBar({ visible }) {
  const [done, setDone] = useState(false);
  const key = useRef(0);
  useEffect(() => {
    if (visible) { key.current += 1; setDone(false); } else { setDone(true); }
  }, [visible]);
  if (!visible && !done) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-blue-100 overflow-hidden">
      <div
        key={key.current}
        className={`h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 transition-all ${done ? 'w-full duration-300' : 'loadbar-anim'}`}
        onTransitionEnd={() => setDone(false)}
      />
    </div>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      <span className="dot-1 w-1.5 h-1.5 rounded-full bg-blue-300 inline-block" />
      <span className="dot-2 w-1.5 h-1.5 rounded-full bg-blue-300 inline-block" />
      <span className="dot-3 w-1.5 h-1.5 rounded-full bg-blue-300 inline-block" />
    </span>
  );
}

function Highlight({ text, query }) {
  if (!query) return <>{text}</>;
  const terms = query.split(/\s+/).filter(t => !t.startsWith('-') && t.length > 1);
  if (!terms.length) return <>{text}</>;
  try {
    const pattern = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const parts = text.split(new RegExp(`(${pattern})`, 'gi'));
    return <>{parts.map((p, i) => i % 2 === 1
      ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{p}</mark>
      : p
    )}</>;
  } catch { return <>{text}</>; }
}

function PlataformaButtons() {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {PLATAFORMAS.map((p, i) => (
        <Tooltip key={p.id}>
          <TooltipTrigger asChild>
            <a
              href={p.url} target="_blank" rel="noopener noreferrer"
              style={{ animationDelay: `${i * 50}ms` }}
              className="card-in inline-flex items-center justify-center w-9 h-9 rounded-xl
                bg-white/20 border border-white/30 backdrop-blur-sm
                transition-all duration-200 hover:bg-white/35 hover:border-white/60
                hover:-translate-y-0.5 hover:shadow-lg active:scale-90"
            >
              <img src={p.faviconUrl} alt={p.label} width={18} height={18}
                className="rounded object-contain"
                onError={e => { e.currentTarget.style.display = 'none'; }} />
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{p.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function PillBtn({ active, onClick, children, activeClass = 'bg-gray-900 text-white border-gray-900', className = '', title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all duration-150 hover:scale-105 active:scale-95 ${
        active ? `${activeClass} shadow-sm` : `bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900`
      } ${className}`}
    >
      {children}
    </button>
  );
}

function VagaCard({ vaga, isNovo, isFavorita, ehDuplicata, foiVisitada, noKanban, onOpen, onToggleFav, onOcultar, onEmpresaClick, onTechClick, onKanban, busca = '', vista = 'grade', tamanho = 'normal', index = 0 }) {
  const tipo     = tipoLocalidade(vaga.local);
  const loc      = LOCALIDADE_CONFIG[tipo];
  const fonteCfg = FONTE_CONFIG[vaga.fonte] || { label: vaga.fonte, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  const dataRel  = formatData(vaga.data);
  const senior   = detectSenioridade(vaga.titulo);
  const techs    = detectarTechs(vaga.titulo);

  if (vista === 'lista') {
    return (
      <div style={{ animationDelay: `${Math.min(index * 15, 200)}ms` }} className="card-in">
        <div
          onClick={() => onOpen(vaga)}
          className="cursor-pointer flex items-center gap-3 bg-white rounded-2xl border border-gray-100
            shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-150 px-4 py-3.5 group relative"
        >
          <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ backgroundColor: fonteCfg.accent || loc.accent }} />
          <div className="h-11 w-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold ml-2 shadow-sm" style={{ backgroundColor: loc.accent }}>
            {iniciais(vaga.empresa)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-1 mb-1">
              <span className={`inline-flex items-center rounded-md border px-1.5 py-px text-[10px] font-bold uppercase ${fonteCfg.color}`}>{fonteCfg.label}</span>
              {senior && <span className={`text-[10px] font-semibold px-1.5 py-px rounded-md border ${senior === 'junior' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : senior === 'senior' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-cyan-50 text-cyan-700 border-cyan-200'}`}>{senior === 'junior' ? 'Jr' : senior === 'senior' ? 'Sr' : 'Pl'}</span>}
              {isNovo && <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-px rounded-full">Novo</span>}
              {noKanban && <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-px rounded-md border border-indigo-200">📋</span>}
              {ehDuplicata && <Tooltip><TooltipTrigger asChild><span className="bg-orange-50 text-orange-600 text-[10px] font-semibold px-1.5 py-px rounded-md border border-orange-200 cursor-help">2+</span></TooltipTrigger><TooltipContent className="text-xs">Aparece em mais de uma fonte</TooltipContent></Tooltip>}
            </div>
            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 truncate transition-colors leading-snug">
              <Highlight text={vaga.titulo} query={busca} />
            </p>
            <p className="text-xs text-gray-500 truncate mt-0.5 cursor-pointer hover:text-blue-500 transition-colors"
              onClick={e => { e.stopPropagation(); onEmpresaClick?.(vaga.empresa); }}>
              {vaga.empresa === 'N/A' ? '—' : vaga.empresa}
              {vaga.local !== 'N/A' && <> · {vaga.local}</>}
              {dataRel && <> · {dataRel}</>}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
            {techs.slice(0, 2).map(t => (
              <button key={t.label} onClick={e => { e.stopPropagation(); onTechClick?.(t.label); }}
                className={`hidden lg:block text-[10px] font-semibold px-2 py-0.5 rounded-md border hover:scale-105 transition-all flex-shrink-0 ${t.color}`}>{t.label}</button>
            ))}
          </div>
          <button onClick={e => { e.stopPropagation(); onToggleFav(vaga.link, e); }} className="p-1.5 flex-shrink-0 hover:scale-110 transition-transform">
            <HeartIcon className={`h-4 w-4 transition-colors ${isFavorita ? 'fill-rose-500 text-rose-500' : 'text-gray-300 hover:text-rose-400'}`} />
          </button>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={e => { e.stopPropagation(); onOcultar?.(vaga.link, e); }} className="p-1.5 flex-shrink-0 text-gray-200 hover:text-gray-500 transition-colors">
                <EyeOffIcon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Ocultar</TooltipContent>
          </Tooltip>
          <ChevronRightIcon className="h-4 w-4 text-gray-300 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
        </div>
      </div>
    );
  }

  // Vista grade
  const compact = tamanho === 'compacto';
  return (
    <div style={{ animationDelay: `${Math.min(index * 40, 500)}ms` }} className={`card-in h-full ${foiVisitada ? 'opacity-75' : ''}`}>
      <div
        onClick={() => onOpen(vaga)}
        className={`cursor-pointer h-full flex flex-col bg-white rounded-2xl overflow-hidden border
          shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-gray-200 transition-all duration-200 group relative ${foiVisitada ? 'border-gray-100' : 'border-gray-100'}`}
      >
        <div className="h-1.5 w-full flex-shrink-0" style={{ backgroundColor: fonteCfg.accent || loc.accent }} />

        {/* Ações top-right */}
        <div className="absolute top-3.5 right-3 z-10 flex items-center gap-0.5">
          {ehDuplicata && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] bg-orange-50 text-orange-500 border border-orange-200 px-1.5 py-0.5 rounded-full cursor-help font-semibold">2+</span>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Aparece em mais de uma fonte</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={e => { e.stopPropagation(); onOcultar?.(vaga.link, e); }}
                className="p-1.5 rounded-full text-gray-200 hover:text-gray-500 hover:bg-gray-100 transition-all">
                <EyeOffIcon className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Ocultar vaga</TooltipContent>
          </Tooltip>
          <button onClick={e => onToggleFav(vaga.link, e)}
            className="p-1.5 rounded-full transition-all hover:scale-110 active:scale-95">
            <HeartIcon className={`h-4 w-4 transition-colors ${isFavorita ? 'fill-rose-500 text-rose-500' : 'text-gray-300 hover:text-rose-400'}`} />
          </button>
        </div>

        {isNovo && (
          <span className="absolute top-4 right-20 z-10 bg-green-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow-sm">Novo</span>
        )}
        {noKanban && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="absolute top-11 right-20 z-10 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">📋</span>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Já no seu quadro</TooltipContent>
          </Tooltip>
        )}

        {/* Cabeçalho */}
        <div className={`${compact ? 'px-3.5 pt-3.5 pb-2' : 'px-5 pt-5 pb-3'} flex gap-3 items-start`}>
          <div className={`${compact ? 'h-9 w-9 text-sm' : 'h-12 w-12 text-base'} rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold shadow-md transition-transform duration-200 group-hover:scale-105`}
            style={{ backgroundColor: loc.accent }}>
            {iniciais(vaga.empresa)}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-xs font-semibold text-gray-400 truncate leading-none mb-1.5 cursor-pointer hover:text-blue-500 transition-colors"
              onClick={e => { e.stopPropagation(); onEmpresaClick?.(vaga.empresa); }}
              title="Clique para filtrar por empresa">
              {vaga.empresa === 'N/A' ? '—' : vaga.empresa}
            </p>
            <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${fonteCfg.color}`}>
              {fonteCfg.label}
            </span>
          </div>
        </div>

        {/* Título */}
        <div className={`${compact ? 'px-3.5 pb-2' : 'px-5 pb-4'} flex-1`}>
          <h3 className={`${compact ? 'text-[0.82rem]' : 'text-[0.95rem]'} font-bold leading-snug line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors duration-150`}>
            <Highlight text={vaga.titulo} query={busca} />
          </h3>
        </div>

        {/* Metadados */}
        <div className={`${compact ? 'px-3.5 pb-2' : 'px-5 pb-4'} space-y-2`}>
          {!compact && (
            <div className="flex flex-col gap-1.5 text-xs text-gray-500">
              <span className="flex items-center gap-2">
                <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="truncate">{vaga.local !== 'N/A' ? vaga.local : '—'}</span>
              </span>
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>{dataRel ?? <span className="italic text-gray-400">sem data</span>}</span>
              </span>
            </div>
          )}
          {compact && (
            <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
              <MapPinIcon className="h-3 w-3 shrink-0" />
              {vaga.local !== 'N/A' ? vaga.local : '—'} {dataRel ? `· ${dataRel}` : ''}
            </p>
          )}

          <div className="flex flex-wrap gap-1">
            {loc.label && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${loc.badge}`}>{loc.label}</span>}
            {senior && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                senior === 'junior' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                senior === 'senior' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                                     'bg-cyan-50 text-cyan-700 border-cyan-200'
              }`}>
                {senior === 'junior' ? 'Jr' : senior === 'senior' ? 'Sr' : 'Pl'}
              </span>
            )}
            {techs.slice(0, compact ? 2 : 3).map(t => (
              <button key={t.label} onClick={e => { e.stopPropagation(); onTechClick?.(t.label); }}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all hover:scale-105 active:scale-95 ${t.color}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* CTA — hidden in compact mode */}
        {!compact && (
          <div className="px-5 pb-5 flex gap-2">
            <div className="flex-1 h-9 rounded-xl bg-gray-50 group-hover:bg-blue-600 border border-gray-200 group-hover:border-blue-600
              text-gray-500 group-hover:text-white text-xs font-semibold
              transition-all duration-200 flex items-center justify-center gap-1.5">
              Ver detalhes
              <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={e => { e.stopPropagation(); onKanban?.(vaga, e); }}
                  disabled={noKanban}
                  className={`h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl border text-xs transition-all ${
                    noKanban ? 'bg-indigo-50 border-indigo-200 text-indigo-400 cursor-default' : 'bg-white border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <KanbanIcon className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">{noKanban ? 'Já no quadro' : 'Adicionar ao quadro'}</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

function VagaCardSkeleton({ index = 0, vista = 'grade' }) {
  if (vista === 'lista') {
    return (
      <div style={{ animationDelay: `${index * 30}ms` }} className="card-in">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5 shadow-sm">
          <div className="h-11 w-11 rounded-xl shimmer flex-shrink-0 ml-2" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-1"><div className="h-4 w-16 rounded-md shimmer" /><div className="h-4 w-10 rounded-md shimmer" /></div>
            <div className="h-4 w-3/4 rounded shimmer" />
            <div className="h-3 w-1/2 rounded shimmer" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ animationDelay: `${index * 60}ms` }} className="card-in h-full">
      <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="h-1.5 w-full shimmer" />
        <div className="px-5 pt-5 pb-3 flex gap-3.5 items-start">
          <div className="h-12 w-12 rounded-xl shrink-0 shimmer" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3 w-2/3 rounded shimmer" />
            <div className="h-5 w-20 rounded-lg shimmer" />
          </div>
        </div>
        <div className="px-5 pb-4 flex-1 space-y-1.5">
          <div className="h-4 w-full rounded shimmer" />
          <div className="h-4 w-4/5 rounded shimmer" />
        </div>
        <div className="px-5 pb-4 space-y-2">
          <div className="h-3.5 w-3/5 rounded shimmer" />
          <div className="h-3.5 w-2/5 rounded shimmer" />
          <div className="flex gap-1.5 mt-1">
            <div className="h-6 w-16 rounded-lg shimmer" />
            <div className="h-6 w-20 rounded-lg shimmer" />
          </div>
        </div>
        <div className="px-5 pb-5"><div className="h-9 w-full rounded-xl shimmer" /></div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Home() {
  const [vagas,        setVagas]        = useState([]);
  const [novasLinks,   setNovasLinks]   = useState(new Set());
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);
  const [filtro,       setFiltro]       = useState('bauru');
  const [senioridade,  setSenioridade]  = useState('todas');
  const [modalidade,   setModalidade]   = useState(null);
  const [periodo,      setPeriodo]      = useState('24h');
  const [busca,        setBusca]        = useState('');
  const [geradoEm,     setGeradoEm]     = useState(null);
  const [fontes,       setFontes]       = useState({});
  const [selectedVaga, setSelectedVaga] = useState(null);
  const [novosCount,   setNovosCount]   = useState(0);
  const [gridKey,      setGridKey]      = useState(0);
  const [filterKey,    setFilterKey]    = useState(0);
  const [favoritas,    setFavoritas]    = useState(new Set());
  const [ocultas,      setOcultas]      = useState(new Set());
  const [mostrarStats, setMostrarStats] = useState(false);
  const [ordem,        setOrdem]        = useState('data');
  const [darkMode,     setDarkMode]     = useState(false);
  const [techFiltro,   setTechFiltro]   = useState(null);
  const [vista,          setVista]          = useState('grade');
  const [tamanho,        setTamanho]        = useState('normal'); // 'compacto' | 'normal'
  const [silencioso,     setSilencioso]     = useState(false);
  const [onboarding,     setOnboarding]     = useState(false);
  const [resumo,         setResumo]         = useState(null);
  const [historicoBusca, setHistoricoBusca] = useState([]);
  const [mostrarHist,    setMostrarHist]    = useState(false);
  const [visitadas,      setVisitadas]      = useState(new Set());
  const [modoTrabalho,   setModoTrabalho]   = useState(null); // 'remoto'|'hibrido'|'presencial'
  const [mostrarTop,     setMostrarTop]     = useState(false);
  const [pinarFavoritas,    setPinarFavoritas]    = useState(false);
  const [kanban,            setKanbanState]       = useState(new Set());
  const [somenteNovas,      setSomenteNovas]      = useState(false);
  const [naoVisitadas,      setNaoVisitadas]      = useState(false);
  const [empresaBusca,      setEmpresaBusca]      = useState('');
  const [agrupar,           setAgrupar]           = useState('nenhum');
  const [filtrosSalvos,     setFiltrosSalvos]     = useState([]);
  const [mostrarSalvos,     setMostrarSalvos]     = useState(false);
  const [filtrosVisiveis,   setFiltrosVisiveis]   = useState(true);

  const buscaDebounced = useDebounce(busca, 220);

  const toastIdRef    = useRef(null);
  const searchRef     = useRef(null);
  const silenciosoRef = useRef(false);
  const vagasOrdRef   = useRef([]);

  useEffect(() => { silenciosoRef.current = silencioso; }, [silencioso]);

  const fetchVagas = useCallback(async (opts = {}) => {
    const { force = false, silent = false } = opts;
    if (!silent) { if (force) setRefreshing(true); else setLoading(true); }
    setError(null);
    try {
      const res  = await fetch(force ? '/api/vagas?refresh=1' : '/api/vagas');
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const data = await res.json();
      const novasVagas = data.vagas || [];

      let novos = new Set();
      try {
        const vistos = new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]'));
        if (vistos.size > 0) {
          novasVagas.forEach(v => { if (!vistos.has(v.link)) novos.add(v.link); });
          const qtd = novos.size;
          if (qtd > 0) {
            setNovosCount(qtd);
            if (typeof window !== 'undefined' && Notification?.permission === 'granted') {
              new Notification(`${qtd} nova${qtd > 1 ? 's vagas' : ' vaga'} de TI em Bauru!`, {
                body: 'Clique para ver as novidades.', icon: '/icon-192.png',
              });
            }
            if (!silenciosoRef.current) {
              if (toastIdRef.current) toast.dismiss(toastIdRef.current);
              toastIdRef.current = toast.success(
                `${qtd} nova${qtd > 1 ? 's vagas' : ' vaga'} encontrada${qtd > 1 ? 's' : ''}! 🎉`,
                { description: 'Novas vagas destacadas em verde.', duration: 8000,
                  action: { label: 'Ver novas', onClick: () => { setFiltro('todas'); setPeriodo('todos'); setBusca(''); window.scrollTo({ top: 0, behavior: 'smooth' }); } } }
              );
            }
          }
        }
        localStorage.setItem(LS_KEY, JSON.stringify(novasVagas.map(v => v.link)));
      } catch (_) {}

      setNovasLinks(novos);
      setVagas(novasVagas);
      setGeradoEm(data.gerado_em);
      setFontes(data.fontes || {});
      setGridKey(k => k + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchVagas(); }, [fetchVagas]);
  useEffect(() => {
    const id = setInterval(() => fetchVagas({ silent: true }), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchVagas]);

  useEffect(() => {
    try { setFavoritas(new Set(JSON.parse(localStorage.getItem(LS_FAV) || '[]'))); } catch (_) {}
    try { setOcultas(new Set(JSON.parse(localStorage.getItem(LS_OCULTAS) || '[]'))); } catch (_) {}
    try { setVisitadas(new Set(JSON.parse(localStorage.getItem(LS_VISITADAS) || '[]'))); } catch (_) {}
    try { setHistoricoBusca(JSON.parse(localStorage.getItem(LS_HISTORICO) || '[]')); } catch (_) {}
    try { setKanbanState(new Set(Object.keys(JSON.parse(localStorage.getItem(LS_KANBAN) || '{}')))); } catch (_) {}
    try { setFiltrosSalvos(JSON.parse(localStorage.getItem('vagas_filtros_salvos') || '[]')); } catch (_) {}
    try { const dm = localStorage.getItem('darkMode'); if (dm !== null) setDarkMode(dm === 'true'); } catch (_) {}
    try { const sl = localStorage.getItem('silencioso'); if (sl !== null) setSilencioso(sl === 'true'); } catch (_) {}
    if (!localStorage.getItem('onboarding_done')) setOnboarding(true);
    const ultima = localStorage.getItem('ultima_visita');
    const agora = Date.now();
    if (ultima && agora - parseInt(ultima) > 6 * 3600 * 1000) {
      setResumo({ horas: Math.floor((agora - parseInt(ultima)) / 3600000) });
    }
    localStorage.setItem('ultima_visita', agora.toString());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem('darkMode', String(darkMode)); } catch (_) {}
  }, [darkMode]);

  useEffect(() => {
    try { localStorage.setItem('silencioso', String(silencioso)); } catch (_) {}
  }, [silencioso]);

  useEffect(() => {
    document.title = novosCount > 0 ? `(${novosCount}) Vagas de TI em Bauru` : 'Vagas de TI em Bauru';
  }, [novosCount]);

  useEffect(() => { setFilterKey(k => k + 1); }, [filtro, senioridade, modalidade, modoTrabalho, techFiltro, somenteNovas, naoVisitadas]);

  // Atalhos de teclado (/, Esc, ←→ navegação entre vagas)
  useEffect(() => {
    function handler(e) {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault(); searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (selectedVaga) { setSelectedVaga(null); return; }
        if (busca) { setBusca(''); return; }
        if (techFiltro) { setTechFiltro(null); return; }
        if (modalidade) { setModalidade(null); return; }
      }
      if (selectedVaga && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        const lista = vagasOrdRef.current;
        const idx   = lista.findIndex(v => v.link === selectedVaga.link);
        if (e.key === 'ArrowLeft'  && idx > 0)               setSelectedVaga(lista[idx - 1]);
        if (e.key === 'ArrowRight' && idx < lista.length - 1) setSelectedVaga(lista[idx + 1]);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedVaga, busca, techFiltro, modalidade]);

  const prevFiltroRef = useRef({ filtro, senioridade, periodo, busca, modalidade, techFiltro });
  useEffect(() => {
    const p = prevFiltroRef.current;
    if (p.filtro !== filtro || p.senioridade !== senioridade || p.periodo !== periodo || p.busca !== busca || p.modalidade !== modalidade || p.techFiltro !== techFiltro) {
      setGridKey(k => k + 1);
      prevFiltroRef.current = { filtro, senioridade, periodo, busca, modalidade, techFiltro };
    }
  }, [filtro, senioridade, periodo, busca, modalidade, techFiltro]);

  const duplicatas = useMemo(() => {
    const map = new Map();
    vagas.forEach(v => {
      const key = `${(v.titulo || '').toLowerCase().trim()}|||${(v.empresa || '').toLowerCase().trim()}`;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(v.fonte);
    });
    const dup = new Set();
    vagas.forEach(v => {
      const key = `${(v.titulo || '').toLowerCase().trim()}|||${(v.empresa || '').toLowerCase().trim()}`;
      if ((map.get(key)?.size || 0) > 1) dup.add(v.link);
    });
    return dup;
  }, [vagas]);

  function limparFiltros() {
    setFiltro('bauru');
    setSenioridade('todas');
    setModalidade(null);
    setTechFiltro(null);
    setModoTrabalho(null);
    setBusca('');
    setPeriodo('24h');
    setPinarFavoritas(false);
    setSomenteNovas(false);
    setNaoVisitadas(false);
    setEmpresaBusca('');
    toast('Filtros limpos');
  }

  function salvarFiltroAtual() {
    const nome = window.prompt('Nome para esses filtros (ex: "React Sênior Bauru"):');
    if (!nome?.trim()) return;
    const preset = { nome: nome.trim(), filtro, senioridade, modalidade, techFiltro, modoTrabalho, periodo, ordem, busca };
    const novos = [preset, ...filtrosSalvos.filter(f => f.nome !== preset.nome)].slice(0, 6);
    setFiltrosSalvos(novos);
    localStorage.setItem('vagas_filtros_salvos', JSON.stringify(novos));
    toast.success(`Filtros "${preset.nome}" salvos! 🔖`);
  }

  function restaurarFiltro(preset) {
    setFiltro(preset.filtro || 'todas');
    setSenioridade(preset.senioridade || 'todas');
    setModalidade(preset.modalidade || null);
    setTechFiltro(preset.techFiltro || null);
    setModoTrabalho(preset.modoTrabalho || null);
    setPeriodo(preset.periodo || '24h');
    setOrdem(preset.ordem || 'data');
    setBusca(preset.busca || '');
    setMostrarSalvos(false);
    toast(`Filtros "${preset.nome}" aplicados`);
  }

  function removerFiltroSalvo(nome) {
    const novos = filtrosSalvos.filter(f => f.nome !== nome);
    setFiltrosSalvos(novos);
    localStorage.setItem('vagas_filtros_salvos', JSON.stringify(novos));
  }

  function salvarHistorico(termo) {
    if (!termo.trim() || termo.length < 2) return;
    setHistoricoBusca(prev => {
      const next = [termo, ...prev.filter(t => t !== termo)].slice(0, 8);
      localStorage.setItem(LS_HISTORICO, JSON.stringify(next));
      return next;
    });
  }

  function marcarVisitada(link) {
    setVisitadas(prev => {
      if (prev.has(link)) return prev;
      const next = new Set(prev);
      next.add(link);
      localStorage.setItem(LS_VISITADAS, JSON.stringify([...next]));
      return next;
    });
  }

  function exportarCSV() {
    const header = 'Título,Empresa,Local,Data,Fonte,Tecnologias,Link';
    const rows = vagasFiltradas.map(v => {
      const techs = detectarTechs(v.titulo).map(t => t.label).join('; ');
      return [v.titulo, v.empresa, v.local, v.data || '', v.fonte, techs, v.link]
        .map(x => `"${String(x || '').replace(/"/g, '""')}"`)
        .join(',');
    });
    const blob = new Blob(['﻿' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `vagas-ti-bauru-${new Date().toISOString().split('T')[0]}.csv` }).click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
  }

  async function ativarNotificacoes() {
    if (!('Notification' in window)) return toast.error('Navegador não suporta notificações');
    const perm = await Notification.requestPermission();
    if (perm === 'granted') toast.success('Notificações ativadas! ✅');
    else toast.error('Permissão negada');
  }

  const toggleFavorita = useCallback((link, e) => {
    e?.stopPropagation();
    setFavoritas(prev => {
      const next = new Set(prev);
      if (next.has(link)) { next.delete(link); toast('Removida dos favoritos'); }
      else { next.add(link); toast.success('Adicionada aos favoritos! ❤️'); }
      localStorage.setItem(LS_FAV, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const adicionarKanbanRapido = useCallback((vaga, e) => {
    e?.stopPropagation();
    if (kanban.has(vaga.link)) return;
    try {
      const kb = JSON.parse(localStorage.getItem(LS_KANBAN) || '{}');
      kb[vaga.link] = {
        link: vaga.link, titulo: vaga.titulo, empresa: vaga.empresa,
        local: vaga.local, data: vaga.data, status: 'salvo', fonte: vaga.fonte,
        adicionadoEm: new Date().toISOString(),
      };
      localStorage.setItem(LS_KANBAN, JSON.stringify(kb));
      setKanbanState(prev => new Set([...prev, vaga.link]));
      toast.success('Adicionada ao quadro! 📋');
    } catch (_) {}
  }, [kanban]);

  const ocultarVaga = useCallback((link, e) => {
    e?.stopPropagation();
    setOcultas(prev => {
      const next = new Set(prev);
      next.add(link);
      localStorage.setItem(LS_OCULTAS, JSON.stringify([...next]));
      return next;
    });
    toast('Vaga ocultada', {
      action: { label: 'Desfazer', onClick: () => setOcultas(prev => {
        const next = new Set(prev); next.delete(link);
        localStorage.setItem(LS_OCULTAS, JSON.stringify([...next]));
        return next;
      })},
      duration: 5000,
    });
  }, []);

  const vagasFiltradas = useMemo(() => vagas.filter(v => {
    if (ocultas.has(v.link)) return false;
    const tipo = tipoLocalidade(v.local);
    const matchLoc =
      filtro === 'todas'      ? true :
      filtro === 'favoritas'  ? favoritas.has(v.link) :
      filtro === 'bauru'      ? tipo === 'bauru' :
      filtro === 'regiao'     ? (tipo === 'bauru' || tipo === 'regiao') :
      filtro === 'remoto'     ? tipo === 'remoto' :
      filtro === 'vagasbauru' ? v.fonte === 'vagasbauru' :
      filtro === 'linkedin'   ? v.fonte === 'linkedin' :
      filtro === 'indeed'     ? v.fonte === 'indeed' :
      filtro === 'vagascom'   ? v.fonte === 'vagascom' :
      filtro === 'ciee'       ? v.fonte === 'ciee' :
      filtro === 'catho'      ? v.fonte === 'catho' : true;
    const matchSen  = senioridade === 'todas' || detectSenioridade(v.titulo) === senioridade;
    const matchMod  = !modalidade || detectarModalidade(v.titulo) === modalidade;
    const matchTech = !techFiltro || detectarTechs(v.titulo).some(t => t.label === techFiltro);
    const matchWork = !modoTrabalho || detectarModoTrabalho(v.local, v.titulo) === modoTrabalho;
    const matchNova   = !somenteNovas  || novasLinks.has(v.link);
    const matchNaoVis = !naoVisitadas  || !visitadas.has(v.link);
    const matchEmp    = !empresaBusca  || (v.empresa || '').toLowerCase().includes(empresaBusca.toLowerCase());
    return matchLoc && matchSen && matchMod && matchTech && matchWork && matchNova && matchNaoVis && matchEmp && matchBusca(v, buscaDebounced) && matchPeriodo(v.data, periodo);
  }), [vagas, ocultas, filtro, favoritas, senioridade, modalidade, techFiltro, modoTrabalho, buscaDebounced, periodo, somenteNovas, naoVisitadas, novasLinks, visitadas, empresaBusca]);

  const vagasOrdenadas = useMemo(() => {
    const sorted = [...vagasFiltradas].sort((a, b) => {
      if (pinarFavoritas) {
        const af = favoritas.has(a.link) ? 0 : 1;
        const bf = favoritas.has(b.link) ? 0 : 1;
        if (af !== bf) return af - bf;
      }
      if (ordem === 'data') {
        if (!a.data && !b.data) return 0;
        if (!a.data) return 1; if (!b.data) return -1;
        return new Date(b.data) - new Date(a.data);
      }
      if (ordem === 'empresa') return (a.empresa || '').localeCompare(b.empresa || '', 'pt-BR');
      if (ordem === 'titulo')  return (a.titulo  || '').localeCompare(b.titulo  || '', 'pt-BR');
      return 0;
    });
    return sorted;
  }, [vagasFiltradas, ordem, pinarFavoritas, favoritas]);

  // Manter ref atualizado para navegação ← →
  useEffect(() => { vagasOrdRef.current = vagasOrdenadas; }, [vagasOrdenadas]);

  // Agrupamento de vagas
  const gruposVagas = useMemo(() => {
    if (agrupar === 'nenhum') return null;
    const grupos = new Map();
    vagasOrdenadas.forEach(v => {
      const key = agrupar === 'empresa'
        ? (v.empresa && v.empresa !== 'N/A' ? v.empresa : 'Sem empresa')
        : (FONTE_CONFIG[v.fonte]?.label || v.fonte || 'Outra');
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key).push(v);
    });
    return [...grupos.entries()]
      .map(([key, items]) => ({ key, label: key, items }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [vagasOrdenadas, agrupar]);

  // Computar top techs e top empresas para stats
  const topTechs = useMemo(() => {
    const map = new Map();
    vagas.forEach(v => detectarTechs(v.titulo).forEach(t => map.set(t.label, (map.get(t.label) || 0) + 1)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [vagas]);

  const topEmpresas = useMemo(() => {
    const map = new Map();
    vagas.forEach(v => { if (v.empresa && v.empresa !== 'N/A') map.set(v.empresa, (map.get(v.empresa) || 0) + 1); });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [vagas]);

  const hora   = geradoEm ? formatTempo(geradoEm) : null;
  const contar = fn => (!loading ? vagas.filter(v => !ocultas.has(v.link) && fn(v)).length : '…');
  const isAtivo = loading || refreshing;

  function abrirVaga(vaga) {
    marcarVisitada(vaga.link);
    setSelectedVaga(vaga);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LoadingBar visible={isAtivo} />

      {/* ── Header ── */}
      <header className="header-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-7 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-none">
                Vagas de TI
                <span className="font-light opacity-60 ml-3 text-2xl">Bauru</span>
              </h1>
              <p className="text-blue-100/80 text-sm mt-2 flex items-center gap-1">
                {loading
                  ? <>Buscando vagas<LoadingDots /></>
                  : hora
                  ? `Atualizado ${hora} · ${vagas.length} vagas encontradas`
                  : 'Pronto'}
              </p>

              {!loading && Object.keys(fontes).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {Object.entries(fontes).map(([f, n]) => n > 0 && (
                    <Tooltip key={f}>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center rounded-full bg-white/15 border border-white/25 px-2.5 py-1 text-[11px] font-semibold text-white/90 cursor-default hover:bg-white/25 transition-colors">
                          {FONTE_CONFIG[f]?.label || f}: {n}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{n} vagas de {FONTE_CONFIG[f]?.label || f}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}

              <PlataformaButtons />
            </div>

            <div className="flex items-center gap-2 self-start">
              {novosCount > 0 && !loading && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="relative inline-flex items-center gap-1.5 rounded-full bg-green-400/20 border border-green-300/40 text-green-100 text-xs font-bold px-3 py-1.5 cursor-default">
                      <BellIcon className="h-3.5 w-3.5" />
                      {novosCount} nova{novosCount > 1 ? 's' : ''}
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 animate-ping" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{novosCount} vaga{novosCount > 1 ? 's novas' : ' nova'} desde a última visita</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={ativarNotificacoes}
                    className="p-2 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all">
                    <BellIcon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Ativar notificações</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setDarkMode(v => !v)}
                    className="p-2 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all">
                    {darkMode ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{darkMode ? 'Modo claro' : 'Modo escuro'}</TooltipContent>
              </Tooltip>

              <Button variant="outline" size="sm" onClick={() => fetchVagas({ force: true })} disabled={isAtivo}
                className="text-white border-white/30 bg-white/10 hover:bg-white/20 hover:text-white gap-2 font-semibold transition-all hover:scale-105 active:scale-95">
                <RefreshCwIcon className={`h-4 w-4 ${isAtivo ? 'animate-spin' : ''}`} />
                {isAtivo ? 'Carregando…' : 'Atualizar'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Barra de filtros ── */}
      <div className="sticky top-0 z-10 bg-white/98 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3">

          {/* Busca + período */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                ref={searchRef}
                placeholder="Buscar título ou empresa… (use -palavra para excluir)"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onFocus={() => setMostrarHist(true)}
                onBlur={() => setTimeout(() => setMostrarHist(false), 150)}
                onKeyDown={e => { if (e.key === 'Enter' && busca.trim()) { salvarHistorico(busca); setMostrarHist(false); } }}
                className="pl-10 pr-8 h-9 text-sm border-gray-200 rounded-xl"
              />
              {busca && (
                <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              )}
              {/* Histórico de buscas */}
              {mostrarHist && historicoBusca.length > 0 && !busca && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><HistoryIcon className="h-3 w-3" />Buscas recentes</span>
                    <button onClick={() => { setHistoricoBusca([]); localStorage.removeItem(LS_HISTORICO); }} className="text-[10px] text-gray-400 hover:text-red-500">Limpar</button>
                  </div>
                  {historicoBusca.map(t => (
                    <button key={t} onClick={() => { setBusca(t); setMostrarHist(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <HistoryIcon className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-42 h-9 text-sm border-gray-200 rounded-xl shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODOS.map(p => <SelectItem key={p.id} value={p.id} className="text-sm">{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setFiltrosVisiveis(v => !v)}
                  className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                    filtrosVisiveis ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <ChevronUpIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${filtrosVisiveis ? '' : 'rotate-180'}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">{filtrosVisiveis ? 'Ocultar filtros' : 'Mostrar filtros'}</TooltipContent>
            </Tooltip>
          </div>

          {/* Filtros */}
          {filtrosVisiveis && (
            <>
              {/* Linha A: Localidade + Fonte + Favoritas (scroll horizontal no mobile) */}
              <div className="flex flex-nowrap gap-2 items-center overflow-x-auto pb-0.5 no-scrollbar [&>*]:shrink-0">
                {[
                  { id: 'todas',  label: 'Todas',  fn: _ => true },
                  { id: 'bauru',  label: 'Bauru',  fn: v => tipoLocalidade(v.local) === 'bauru' },
                  { id: 'regiao', label: 'Região', fn: v => ['bauru','regiao'].includes(tipoLocalidade(v.local)) },
                  { id: 'remoto', label: 'Remoto', fn: v => tipoLocalidade(v.local) === 'remoto' },
                ].map(f => (
                  <PillBtn key={f.id} active={filtro === f.id} onClick={() => setFiltro(f.id)}>
                    {f.label} <span className="opacity-60 text-[10px]">{contar(f.fn)}</span>
                  </PillBtn>
                ))}

                <div className="h-5 w-px bg-gray-200" />

                {Object.entries(FONTE_CONFIG).map(([f, cfg]) => {
                  const n = fontes[f] || 0;
                  if (n === 0 && !loading) return null;
                  return (
                    <PillBtn key={f} active={filtro === f} onClick={() => setFiltro(filtro === f ? 'bauru' : f)}>
                      {cfg.label} {!loading && <span className="opacity-60 text-[10px]">{n}</span>}
                    </PillBtn>
                  );
                })}

                <div className="h-5 w-px bg-gray-200" />

                <PillBtn active={filtro === 'favoritas'} onClick={() => setFiltro(filtro === 'favoritas' ? 'bauru' : 'favoritas')}
                  activeClass="bg-rose-500 text-white border-rose-500"
                  className={filtro !== 'favoritas' ? 'hover:border-rose-300 hover:text-rose-500' : ''}
                  title="Favoritas">
                  <HeartIcon className="h-3.5 w-3.5" />
                  <span className="opacity-70 text-[10px]">{favoritas.size}</span>
                </PillBtn>
              </div>

              {/* Linha B: Senioridade + Modalidade + Modo + Extras (scroll horizontal no mobile) */}
              <div className="flex flex-nowrap gap-2 items-center overflow-x-auto pb-0.5 no-scrollbar [&>*]:shrink-0">
                {[
                  { id: 'junior', label: 'Júnior' },
                  { id: 'pleno',  label: 'Pleno'  },
                  { id: 'senior', label: 'Sênior' },
                ].map(s => (
                  <PillBtn key={s.id} active={senioridade === s.id} onClick={() => setSenioridade(senioridade === s.id ? 'todas' : s.id)}
                    activeClass="bg-violet-600 text-white border-violet-600">
                    {s.label}
                  </PillBtn>
                ))}

                <div className="h-5 w-px bg-gray-200" />

                {[
                  { id: 'clt',     label: 'CLT'     },
                  { id: 'pj',      label: 'PJ'      },
                  { id: 'estagio', label: 'Estágio' },
                  { id: 'trainee', label: 'Trainee' },
                ].map(m => (
                  <PillBtn key={m.id} active={modalidade === m.id} onClick={() => setModalidade(modalidade === m.id ? null : m.id)}
                    activeClass="bg-emerald-600 text-white border-emerald-600">
                    {m.label}
                  </PillBtn>
                ))}

                <div className="h-5 w-px bg-gray-200" />

                {[
                  { id: 'presencial', label: 'Presencial', icon: <MonitorIcon className="h-3 w-3" /> },
                  { id: 'hibrido',    label: 'Híbrido',    icon: <CarIcon className="h-3 w-3" />     },
                  { id: 'remoto',     label: 'Remoto',     icon: <WifiIcon className="h-3 w-3" />    },
                ].map(m => (
                  <PillBtn key={m.id} active={modoTrabalho === m.id} onClick={() => setModoTrabalho(modoTrabalho === m.id ? null : m.id)}
                    activeClass="bg-sky-600 text-white border-sky-600" title={m.label}>
                    {m.icon}
                  </PillBtn>
                ))}

                <div className="h-5 w-px bg-gray-200" />

                <PillBtn active={somenteNovas} onClick={() => setSomenteNovas(v => !v)}
                  activeClass="bg-green-600 text-white border-green-600" title="Somente novas">
                  <SparklesIcon className="h-3.5 w-3.5" />
                </PillBtn>
                <PillBtn active={naoVisitadas} onClick={() => setNaoVisitadas(v => !v)}
                  activeClass="bg-slate-700 text-white border-slate-700" title="Não vistas">
                  <EyeOffIcon className="h-3.5 w-3.5" />
                </PillBtn>

                <div className="relative">
                  <Building2Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Empresa…"
                    value={empresaBusca}
                    onChange={e => setEmpresaBusca(e.target.value)}
                    className="pl-7 pr-7 h-7 text-xs border border-gray-200 rounded-full bg-white focus:outline-none focus:border-blue-400 w-28 focus:w-36 transition-all"
                  />
                  {empresaBusca && (
                    <button onClick={() => setEmpresaBusca('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      <XIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {(filtro !== 'bauru' || senioridade !== 'todas' || modalidade || techFiltro || modoTrabalho || busca || somenteNovas || naoVisitadas || empresaBusca) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={limparFiltros}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-all">
                        <FilterXIcon className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Remover todos os filtros ativos</TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Linha C: Ações */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => setPinarFavoritas(v => !v)}
                      className={`p-2 rounded-xl border transition-all ${pinarFavoritas ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-400 border-gray-200 hover:border-rose-300 hover:text-rose-400'}`}>
                      <HeartIcon className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">{pinarFavoritas ? 'Desafixar favoritas' : 'Fixar favoritas no topo'}</TooltipContent>
                </Tooltip>

                <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => { setVista('grade'); setTamanho('normal'); }}
                        className={`p-2 transition-colors ${vista === 'grade' && tamanho === 'normal' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                        <LayoutGridIcon className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Grade</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => { setVista('grade'); setTamanho('compacto'); }}
                        className={`p-2 border-l border-gray-200 transition-colors ${vista === 'grade' && tamanho === 'compacto' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                        <SparklesIcon className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Compacto (4 colunas)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => setVista('lista')}
                        className={`p-2 border-l border-gray-200 transition-colors ${vista === 'lista' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                        <ListIcon className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Lista</TooltipContent>
                  </Tooltip>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => setSilencioso(v => !v)}
                      className={`p-2 rounded-xl border transition-all ${silencioso ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                      <BellOffIcon className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">{silencioso ? 'Desativar modo silencioso' : 'Modo silencioso'}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => { setMostrarStats(v => !v); if (mostrarTop) setMostrarTop(false); }}
                      className={`p-2 rounded-xl border transition-all ${
                        mostrarStats ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      }`}>
                      <BarChart2Icon className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Estatísticas</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => { setMostrarTop(v => !v); if (mostrarStats) setMostrarStats(false); }}
                      className={`p-2 rounded-xl border transition-all ${
                        mostrarTop ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      }`}>
                      <TrophyIcon className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Top tecnologias e empresas</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <select value={agrupar} onChange={e => setAgrupar(e.target.value)}
                      className={`h-8 text-xs border rounded-xl px-2 pr-6 appearance-none cursor-pointer transition-all ${agrupar !== 'nenhum' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                      <option value="nenhum">Agrupar…</option>
                      <option value="empresa">Por empresa</option>
                      <option value="fonte">Por fonte</option>
                    </select>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Agrupar vagas</TooltipContent>
                </Tooltip>

                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={salvarFiltroAtual}
                        className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-amber-300 hover:text-amber-600 transition-all">
                        <BookmarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Salvar filtros atuais</TooltipContent>
                  </Tooltip>

                  {filtrosSalvos.length > 0 && (
                    <button onClick={() => setMostrarSalvos(v => !v)}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-amber-400 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {filtrosSalvos.length}
                    </button>
                  )}

                  {mostrarSalvos && (
                    <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 w-52 overflow-hidden" onMouseLeave={() => setMostrarSalvos(false)}>
                      <p className="px-3 py-2 text-[11px] font-bold text-gray-400 border-b border-gray-100">Filtros salvos</p>
                      {filtrosSalvos.map(f => (
                        <div key={f.nome} className="flex items-center gap-1 px-3 py-2 hover:bg-gray-50 group">
                          <button onClick={() => restaurarFiltro(f)} className="flex-1 text-left text-xs text-gray-700 font-medium truncate">{f.nome}</button>
                          <button onClick={() => removerFiltroSalvo(f.nome)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <XIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/candidaturas"
                      className="p-2 rounded-xl border bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-all relative">
                      <KanbanIcon className="h-3.5 w-3.5" />
                      {kanban.size > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {kanban.size > 9 ? '9+' : kanban.size}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Candidaturas (quadro Kanban)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/perfil"
                      className="p-2 rounded-xl border bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                      <AwardIcon className="h-3.5 w-3.5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Perfil e certificados</TooltipContent>
                </Tooltip>
              </div>
            </>
          )}

          {/* Top Tecnologias + Empresas */}
          {mostrarTop && !loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5"><TrophyIcon className="h-3.5 w-3.5 text-amber-500" />Top Tecnologias</p>
                <div className="flex flex-col gap-1.5">
                  {topTechs.map(([label, count]) => (
                    <button key={label} onClick={() => setTechFiltro(prev => prev === label ? null : label)}
                      className={`flex items-center gap-2 group text-left rounded-lg px-3 py-2 transition-all border ${techFiltro === label ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100 hover:border-gray-300'}`}>
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (count / (topTechs[0]?.[1] || 1)) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-20 truncate">{label}</span>
                      <span className="text-xs font-bold text-gray-400">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5"><TrophyIcon className="h-3.5 w-3.5 text-emerald-500" />Top Empresas</p>
                <div className="flex flex-col gap-1.5">
                  {topEmpresas.map(([empresa, count]) => (
                    <button key={empresa} onClick={() => setBusca(prev => prev === empresa ? '' : empresa)}
                      className="flex items-center gap-2 text-left rounded-lg px-3 py-2 bg-gray-50 border border-gray-100 hover:border-gray-300 transition-all">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (count / (topEmpresas[0]?.[1] || 1)) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-28 truncate">{empresa}</span>
                      <span className="text-xs font-bold text-gray-400">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pills de tecnologia (top 10) */}
          {!loading && topTechs.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 pt-1" style={{ scrollbarWidth: 'none' }}>
              {topTechs.slice(0, 10).map(([label, count]) => (
                <button key={label}
                  onClick={() => setTechFiltro(prev => prev === label ? null : label)}
                  className={`flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                    techFiltro === label ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}>
                  {label} <span className="opacity-50 text-[10px]">{count}</span>
                </button>
              ))}
              {techFiltro && (
                <button onClick={() => setTechFiltro(null)} className="flex-shrink-0 text-[11px] text-red-400 hover:text-red-600 px-2 font-medium">✕</button>
              )}
            </div>
          )}

          {/* Stats */}
          {mostrarStats && !loading && (
            <div className="pt-2 border-t border-gray-100 animate-in fade-in-0 slide-in-from-top-2 duration-200 flex flex-col gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Total',      value: vagas.length - ocultas.size,                                                color: 'text-gray-900'    },
                  { label: 'Bauru',      value: vagas.filter(v => tipoLocalidade(v.local) === 'bauru').length,               color: 'text-blue-600'    },
                  { label: 'Remoto',     value: vagas.filter(v => tipoLocalidade(v.local) === 'remoto').length,              color: 'text-emerald-600' },
                  { label: 'Ocultadas',  value: ocultas.size,                                                                color: 'text-gray-400'    },
                  { label: 'Júnior',     value: vagas.filter(v => detectSenioridade(v.titulo) === 'junior').length,          color: 'text-yellow-600'  },
                  { label: 'Pleno',      value: vagas.filter(v => detectSenioridade(v.titulo) === 'pleno').length,           color: 'text-cyan-600'    },
                  { label: 'Sênior',     value: vagas.filter(v => detectSenioridade(v.titulo) === 'senior').length,          color: 'text-violet-600'  },
                  { label: 'Duplicadas', value: duplicatas.size,                                                             color: 'text-orange-500'  },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                    <span className="text-sm text-gray-500">{s.label}</span>
                    <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Gráfico vagas por dia */}
              {vagas.some(v => v.data) && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 mb-2">Vagas publicadas — últimos 7 dias</p>
                  <VagasPorDia vagas={vagas} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Onboarding */}
        {onboarding && (
          <div className="mb-5 p-5 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4 animate-in fade-in-0 slide-in-from-top-2 duration-500">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-blue-900 mb-1">Bem-vindo ao Vagas TI Bauru! 👋</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Filtre por localidade, senioridade, modalidade e tecnologia. Favorite vagas com ❤️ e acompanhe no{' '}
                <Link href="/candidaturas" className="font-bold underline">Kanban</Link>.{' '}
                Pressione <kbd className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono border border-blue-200">/</kbd> para buscar,{' '}
                <kbd className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono border border-blue-200">Esc</kbd> para limpar.
                Use <code className="bg-blue-100 px-1 rounded text-xs">-palavra</code> para excluir termos da busca.
              </p>
            </div>
            <button onClick={() => { setOnboarding(false); localStorage.setItem('onboarding_done', '1'); }}
              className="text-blue-400 hover:text-blue-700 transition-colors p-1 flex-shrink-0">
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Retorno após ausência */}
        {resumo && novosCount > 0 && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 animate-in fade-in-0 slide-in-from-top-2 duration-500">
            <ClockIcon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-800 flex-1">
              Você estava ausente por <strong>{resumo.horas}h</strong> — há{' '}
              <strong>{novosCount} nova{novosCount > 1 ? 's vagas' : ' vaga'}</strong> desde a última visita!
            </p>
            <button onClick={() => setResumo(null)} className="text-emerald-400 hover:text-emerald-700 transition-colors">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Vagas ocultadas */}
        {ocultas.size > 0 && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
            <EyeOffIcon className="h-4 w-4" />
            <span>{ocultas.size} vaga{ocultas.size > 1 ? 's ocultadas' : ' ocultada'}</span>
            <button onClick={() => { setOcultas(new Set()); localStorage.removeItem(LS_OCULTAS); toast.success('Vagas restauradas'); }}
              className="text-blue-500 hover:text-blue-700 underline transition-colors font-medium">
              mostrar todas
            </button>
          </div>
        )}

        {/* Barra de resultados */}
        {!loading && !error && (
          <div className="flex items-center justify-between mb-5 animate-in fade-in-0 duration-300">
            <div className="flex items-center flex-wrap gap-2 text-sm text-gray-500">
              <span><strong key={vagasOrdenadas.length} className="text-gray-900 font-bold text-base count-up inline-block">{vagasOrdenadas.length}</strong>{' '}vaga{vagasOrdenadas.length !== 1 ? 's' : ''}</span>
              {busca && (
                <span className="flex items-center gap-1 bg-gray-100 rounded-lg px-2.5 py-1">
                  "{busca}"
                  <button onClick={() => setBusca('')} className="text-gray-400 hover:text-gray-700 ml-0.5"><XIcon className="h-3 w-3" /></button>
                </span>
              )}
              {techFiltro && (
                <span className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2.5 py-1 text-xs font-semibold">
                  {techFiltro}
                  <button onClick={() => setTechFiltro(null)} className="text-blue-400 hover:text-blue-700 ml-0.5"><XIcon className="h-3 w-3" /></button>
                </span>
              )}
              {modalidade && (
                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-2.5 py-1 text-xs font-semibold">
                  {modalidade.toUpperCase()}
                  <button onClick={() => setModalidade(null)} className="text-emerald-400 hover:text-emerald-700 ml-0.5"><XIcon className="h-3 w-3" /></button>
                </span>
              )}
              {novosCount > 0 && <span className="text-green-600 font-semibold">{novosCount} nova{novosCount > 1 ? 's' : ''} ✨</span>}
            </div>
            <div className="flex items-center gap-2">
              <Select value={ordem} onValueChange={setOrdem}>
                <SelectTrigger className="h-8 w-38 text-xs gap-1 border-gray-200 rounded-xl">
                  <ArrowUpDownIcon className="h-3.5 w-3.5 text-gray-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data"    className="text-sm">Mais recente</SelectItem>
                  <SelectItem value="empresa" className="text-sm">Empresa A–Z</SelectItem>
                  <SelectItem value="titulo"  className="text-sm">Título A–Z</SelectItem>
                </SelectContent>
              </Select>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={exportarCSV}
                    className="h-8 w-8 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-all">
                    <DownloadIcon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Exportar CSV</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription className="flex items-center justify-between">
              <span>Erro ao carregar: {error}</span>
              <Button variant="outline" size="sm" onClick={() => fetchVagas()}>Tentar novamente</Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Grid / Lista */}
        {(() => {
          const gridClass = vista === 'lista'
            ? 'flex flex-col gap-2'
            : tamanho === 'compacto'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5';

          const renderCard = (v, i) => (
            <VagaCard
              key={v.link}
              vaga={v}
              isNovo={novasLinks.has(v.link)}
              isFavorita={favoritas.has(v.link)}
              ehDuplicata={duplicatas.has(v.link)}
              foiVisitada={visitadas.has(v.link)}
              noKanban={kanban.has(v.link)}
              onOpen={abrirVaga}
              onToggleFav={toggleFavorita}
              onOcultar={ocultarVaga}
              onKanban={adicionarKanbanRapido}
              onEmpresaClick={emp => { setBusca(emp); salvarHistorico(emp); }}
              onTechClick={tech => setTechFiltro(prev => prev === tech ? null : tech)}
              busca={busca}
              vista={vista}
              tamanho={tamanho}
              index={i}
            />
          );

          const emptyState = (
            <div className="col-span-full py-32 text-center animate-in fade-in-0 zoom-in-95 duration-500">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-sm border border-gray-100 mb-5">
                <BriefcaseIcon className="h-10 w-10 text-gray-300" />
              </div>
              <p className="font-bold text-gray-800 text-xl">Nenhuma vaga encontrada</p>
              <p className="text-base text-gray-400 mt-2">Tente outros filtros ou amplie o período</p>
            </div>
          );

          if (loading) {
            return (
              <div>
                <CenteredLoader />
                <div key={gridKey} className={gridClass}>
                  {Array.from({ length: vista === 'lista' ? 8 : 6 }).map((_, i) => <VagaCardSkeleton key={i} index={i} vista={vista} />)}
                </div>
              </div>
            );
          }

          if (agrupar !== 'nenhum' && gruposVagas) {
            if (vagasOrdenadas.length === 0) return <div className={gridClass}>{emptyState}</div>;
            return (
              <div className="flex flex-col gap-8">
                {gruposVagas.map(({ key, label, items }) => (
                  <div key={key}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="h-px flex-1 bg-gray-200" />
                      <span className="text-sm font-bold text-gray-600 flex items-center gap-1.5">
                        <LayersIcon className="h-3.5 w-3.5 text-gray-400" />
                        {label} <span className="font-normal text-gray-400">({items.length})</span>
                      </span>
                      <span className="h-px flex-1 bg-gray-200" />
                    </div>
                    <div key={`${gridKey}-${key}`} className={gridClass}>
                      {items.map(renderCard)}
                    </div>
                  </div>
                ))}
              </div>
            );
          }

          if (vagasOrdenadas.length === 0 && !error) {
            return <div className={gridClass}>{emptyState}</div>;
          }

          return (
            <div key={`${gridKey}-${filterKey}`} className={`${gridClass} fade-slide-up`}>
              {vagasOrdenadas.map(renderCard)}
            </div>
          );
        })()}
      </main>

      <footer className="text-center text-sm text-gray-400 py-12 border-t border-gray-100">
        Vagas de{' '}
        {['LinkedIn','VagasBauru','Indeed','Vagas.com','CIEE'].map((s, i, a) => (
          <span key={s}><span className="font-medium text-gray-500">{s}</span>{i < a.length - 1 ? ', ' : ''}</span>
        ))}
        {' '}· Atualiza a cada 10 min · Pressione{' '}
        <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono border">/</kbd> para buscar
        <br />
        {/* Criado por Daniel Ortega Pereira */}
        <span className="mt-2 inline-block text-xs text-gray-300">
          Criado por{' '}
          <a
            href="https://www.linkedin.com/in/daniel-op/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-500 transition-colors font-medium"
          >
            Daniel Ortega Pereira
          </a>
        </span>
      </footer>

      <ScrollToTopButton />

      {selectedVaga && (() => {
        const idx  = vagasOrdRef.current.findIndex(v => v.link === selectedVaga.link);
        const prev = idx > 0 ? vagasOrdRef.current[idx - 1] : null;
        const next = idx < vagasOrdRef.current.length - 1 ? vagasOrdRef.current[idx + 1] : null;
        return (
          <VagaModal
            vaga={selectedVaga}
            vagas={vagas}
            onClose={() => setSelectedVaga(null)}
            onOpen={abrirVaga}
            onPrev={prev ? () => abrirVaga(prev) : null}
            onNext={next ? () => abrirVaga(next) : null}
          />
        );
      })()}
    </div>
  );
}
