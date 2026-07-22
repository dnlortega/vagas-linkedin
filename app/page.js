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
  LogOutIcon, SlidersHorizontalIcon, ChevronDownIcon, AlertTriangleIcon
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import VagaModal from './components/VagaModal';

// ─── Constantes ──────────────────────────────────────────────────────────────

const CIDADES = ['agudos', 'bauru', 'botucatu', 'jau', 'jaú', 'lencois', 'lençóis', 'pederneiras'];
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
  linkedin:       { label: 'LinkedIn',       color: 'bg-blue-100 text-blue-700 border-blue-200',      accent: '#3b82f6' },
  vagasbauru:     { label: 'VagasBauru',     color: 'bg-rose-100 text-rose-700 border-rose-200',      accent: '#f43f5e' },
  indeed:         { label: 'Indeed',         color: 'bg-sky-100 text-sky-700 border-sky-200',          accent: '#0ea5e9' },
  vagascom:       { label: 'Vagas.com',      color: 'bg-amber-100 text-amber-700 border-amber-200',   accent: '#f59e0b' },
  ciee:           { label: 'CIEE',           color: 'bg-teal-100 text-teal-700 border-teal-200',      accent: '#14b8a6' },
  catho:          { label: 'Catho',          color: 'bg-orange-100 text-orange-700 border-orange-200',accent: '#f97316' },
  empregoscom:    { label: 'Empregos',       color: 'bg-lime-100 text-lime-700 border-lime-200',      accent: '#84cc16' },
  querovagastech: { label: 'QueroVagas',     color: 'bg-violet-100 text-violet-700 border-violet-200',accent: '#8b5cf6' },
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
  { id: 'empregos',      label: 'Empregos',       url: 'https://www.empregos.com.br/empregos/desenvolvedor/bauru-sp',                                                                     faviconUrl: favicon('empregos.com.br')         },
  { id: 'querovagastech', label: 'QueroVagas Tech', url: 'https://www.querovagastech.com.br/',                                                                                               faviconUrl: favicon('querovagastech.com.br')   },
];

const TECHS = [
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
        <p className="text-lg font-bold text-gray-800">Buscando vagas…</p>
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

function Logo({ size = 46 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <rect width="46" height="46" rx="11" fill="white" fillOpacity="0.2"/>
      {/* < */}
      <path d="M11 15 L5 23 L11 31" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
      {/* V */}
      <path d="M17 13 L23 33 L29 13" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
      {/* / */}
      <path d="M33 33 L38 13" stroke="white" strokeWidth="2.6" strokeLinecap="round"/>
      {/* > */}
      <path d="M35 15 L41 23 L35 31" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PWAInstallBtn({ prompt, setPrompt, installed }) {
  if (installed || !prompt) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={async () => {
            prompt.prompt();
            const { outcome } = await prompt.userChoice;
            if (outcome === 'accepted') setPrompt(null);
          }}
          className="p-2 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all"
        >
          <DownloadIcon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Instalar app no celular</TooltipContent>
    </Tooltip>
  );
}

function PillBtn({ active, onClick, children, activeClass = 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200/50', className = '', title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] ${
        active ? `${activeClass} shadow-md` : `bg-white/80 backdrop-blur-xs text-slate-600 border-slate-200/70 hover:border-slate-350 hover:text-slate-900 shadow-sm shadow-slate-100/40 hover:shadow`
      } ${className}`}
    >
      {children}
    </button>
  );
}

function VagaCard({ vaga, isNovo, isFavorita, ehDuplicata, foiVisitada, noKanban, onOpen, onToggleFav, onOcultar, onEmpresaClick, onTechClick, onKanban, onReport, busca = '', vista = 'grade', tamanho = 'normal', index = 0 }) {
  const tipo     = tipoLocalidade(vaga.local);
  const loc      = LOCALIDADE_CONFIG[tipo];
  const fonteCfg = FONTE_CONFIG[vaga.fonte] || { label: vaga.fonte, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  const dataRel  = formatData(vaga.data);
  const senior   = detectSenioridade(vaga.titulo);
  const techsRegex = detectarTechs(vaga.titulo);
  const techsIA = (vaga.competencias || []).map(comp => {
    const regexMatch = TECHS.find(t => t.label.toLowerCase() === comp.toLowerCase() || t.regex.test(comp));
    return { label: comp, color: regexMatch ? regexMatch.color : 'bg-slate-100 text-slate-700 border-slate-200' };
  });
  const techsMap = new Map();
  techsRegex.forEach(t => techsMap.set(t.label.toLowerCase(), t));
  techsIA.forEach(t => techsMap.set(t.label.toLowerCase(), t));
  const techs = Array.from(techsMap.values());

  const TI_REGEX = /\b(desenvolvedor|programador|software|fullstack|full[- ]?stack|front[- ]?end|back[- ]?end|devops|sre|cloud|dados|data|bi\b|power\s?bi|analista.*(sistemas?|t\.?i\.?|dados|suporte|infra|seguran[çc]a)|engenheiro.*(software|dados|cloud)|arquiteto.*(t\.?i\.?|software|solu)|dba|suporte.*(t\.?i\.?|t[ée]cnico)|help.*desk|service.*desk|infra|segurança|cyber|tecnologia|tech|sistemas?|computação|c#|java|python|php|javascript|typescript|node)/i;
  const isTI = TI_REGEX.test(vaga.titulo);

  if (vista === 'lista') {
    return (
      <div style={{ animationDelay: `${Math.min(index * 15, 200)}ms` }} className="card-in">
        <div
          onClick={() => onOpen(vaga)}
          className={`cursor-pointer flex items-center gap-3 bg-white rounded-[14px] px-4 py-3.5 group relative transition-all duration-150
            shadow-[0_1px_3px_rgba(15,23,42,0.05)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)] hover:-translate-y-px ${
              foiVisitada ? 'border border-slate-100 opacity-60' :
              isTI ? 'border-2 border-indigo-200/60 bg-indigo-50/5 hover:border-indigo-400' :
              'border border-slate-100 hover:border-slate-200'
            }`}
        >
          <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ backgroundColor: isTI ? '#6366f1' : (fonteCfg.accent || loc.accent) }} />
          <div className="h-11 w-11 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold ml-2 shadow-sm ring-[3px] ring-white" style={{ backgroundColor: isTI ? '#6366f1' : loc.accent }}>
            {iniciais(vaga.empresa)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-1 mb-1">
              <span className={`inline-flex items-center rounded-md border px-1.5 py-px text-[10px] font-bold uppercase ${fonteCfg.color}`}>{fonteCfg.label}</span>
              {isTI && (
                <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 animate-pulse shadow-sm shadow-indigo-150">
                  ✨ DESTAQUE TI
                </span>
              )}
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
          {onReport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={e => onReport(vaga, e)} className="p-1.5 flex-shrink-0 text-red-200 hover:text-red-500 transition-colors">
                  <AlertTriangleIcon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs bg-red-600 border-red-700">Reportar: Não é TI</TooltipContent>
            </Tooltip>
          )}
          <ChevronRightIcon className="h-4 w-4 text-gray-300 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
        </div>
      </div>
    );
  }

  // Vista grade
  const compact = tamanho === 'compacto';
  return (
    <div style={{ animationDelay: `${Math.min(index * 40, 500)}ms` }} className="card-in h-full">
      <div
        onClick={() => onOpen(vaga)}
        className={`cursor-pointer h-full flex flex-col bg-white rounded-[14px] overflow-hidden border transition-all duration-200 group relative
          shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.03)]
          hover:shadow-[0_10px_28px_rgba(15,23,42,0.10),0_4px_10px_rgba(15,23,42,0.05)]
          hover:-translate-y-1 ${
            foiVisitada ? 'border-slate-100 opacity-60' : 
            isTI ? 'border-indigo-150/90 bg-indigo-50/5 hover:border-indigo-400 shadow-indigo-100/30' :
            'border-slate-100 hover:border-slate-200'
          }`}
      >
        <div className="h-[3.5px] w-full flex-shrink-0" style={{ background: isTI ? 'linear-gradient(90deg, #6366f1, #a855f7)' : `linear-gradient(90deg, ${fonteCfg.accent || loc.accent}, ${fonteCfg.accent || loc.accent}20)` }} />

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
          {onReport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={e => onReport(vaga, e)}
                  className="p-1.5 rounded-full text-red-200 hover:text-red-500 hover:bg-red-50 transition-all">
                  <AlertTriangleIcon className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs bg-red-600 border-red-700 text-white">Reportar: Não é TI</TooltipContent>
            </Tooltip>
          )}
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
          <div className={`${compact ? 'h-9 w-9 text-sm' : 'h-12 w-12 text-base'} rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold shadow-sm ring-[3px] ring-white transition-transform duration-200 group-hover:scale-105`}
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
            {isTI && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ml-1.5 animate-pulse shadow-sm shadow-indigo-100">
                ✨ Destaque TI
              </span>
            )}
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
            <div className="flex-1 h-9 rounded-[10px] bg-slate-50 group-hover:bg-blue-600 border border-slate-200 group-hover:border-blue-600
              text-slate-500 group-hover:text-white text-xs font-semibold tracking-wide
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
        <div className="flex items-center gap-3 bg-white rounded-[14px] border border-slate-100 px-4 py-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
          <div className="h-11 w-11 rounded-full shimmer flex-shrink-0 ml-2" />
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
      <div className="h-full flex flex-col bg-white rounded-[14px] border border-slate-100 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <div className="h-[3px] w-full shimmer" />
        <div className="px-5 pt-5 pb-3 flex gap-3.5 items-start">
          <div className="h-12 w-12 rounded-full shrink-0 shimmer" />
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
  const router = useRouter();
  const { data: session } = useSession();

  const [vagas,        setVagas]        = useState([]);
  const [novasLinks,   setNovasLinks]   = useState(new Set());
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);
  const [filtro,       setFiltro]       = useState('bauru');
  const [senioridade,  setSenioridade]  = useState('todas');
  const [modalidade,   setModalidade]   = useState(null);
  const [periodo,      setPeriodo]      = useState('7d');
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
  const [somenteTI,         setSomenteTI]         = useState(true);
  const [mostrarOpcoes,     setMostrarOpcoes]     = useState(false);
  const [mostrarFiltrosSidebar, setMostrarFiltrosSidebar] = useState(true);

  // Estados e Efeito para suporte a PWA (Instalação e Segundo Plano)
  const [pwaPrompt, setPwaPrompt] = useState(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setPwaInstalled(true));
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

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
    document.title = novosCount > 0 ? `(${novosCount}) Vagas em Bauru` : 'Vagas em Bauru';
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
    if (perm === 'granted') {
      toast.success('Notificações ativadas! ✅');
      
      // Registrar periodic sync também se suportado
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(async (registration) => {
          if ('periodicSync' in registration) {
            try {
              await registration.periodicSync.register('check-new-jobs', {
                minInterval: 4 * 60 * 60 * 1000, // 4 horas
              });
              console.log('Periodic background sync registrado com sucesso!');
            } catch (err) {
              console.log('Periodic sync não registrado:', err);
            }
          }
        });
      }
    } else {
      toast.error('Permissão negada');
    }
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

  const reportNotTI = useCallback(async (vaga, e) => {
    e?.stopPropagation();
    if (!session) {
      toast('Você precisa estar logado para reportar uma vaga.');
      router.push('/login');
      return;
    }
    const toastId = toast.loading('Reportando vaga...');
    try {
      const res = await fetch('/api/vagas/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: vaga.link }),
      });
      if (res.ok) {
        toast.success('Obrigado! A vaga foi removida da lista de TI.', { id: toastId });
        ocultarVaga(vaga.link, null);
      } else {
        toast.error('Erro ao reportar a vaga.', { id: toastId });
      }
    } catch (error) {
      toast.error('Erro de conexão.', { id: toastId });
    }
  }, [session, router, ocultarVaga]);

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
    const TI_REGEX    = /\b(desenvolvedor|programador|software|fullstack|full[- ]?stack|front[- ]?end|back[- ]?end|devops|sre|cloud|dados|data|bi\b|power\s?bi|analista.*(sistemas?|t\.?i\.?|dados|suporte|infra|seguran[çc]a)|engenheiro.*(software|dados|cloud)|arquiteto.*(t\.?i\.?|software|solu)|dba|suporte.*(t\.?i\.?|t[ée]cnico)|help.*desk|service.*desk|infra|segurança|cyber|tecnologia|tech|sistemas?|computação|c#|java|python|php|javascript|typescript|node)/i;
    const EXCLUDE_TI_REGEX = /\b(fiscal|cont[áa]bil|contabilidade|financeiro|rh|recursos humanos|departamento pessoal|vendas|comercial|marketing|faturamento|tribut[áa]rio|cobran[çc]a|telemarketing|atendimento)\b/i;
    const isTI = v.isTI !== false && ((TI_REGEX.test(v.titulo) || detectarTechs(v.titulo).length > 0) 
                 && !EXCLUDE_TI_REGEX.test(v.titulo) 
                 && !EXCLUDE_TI_REGEX.test(v.empresa || ''));
    const matchTI     = !somenteTI || isTI;
    return matchLoc && matchSen && matchMod && matchTech && matchWork && matchNova && matchNaoVis && matchEmp && matchTI && matchBusca(v, buscaDebounced) && matchPeriodo(v.data, periodo);
  }), [vagas, ocultas, filtro, favoritas, senioridade, modalidade, techFiltro, modoTrabalho, buscaDebounced, periodo, somenteNovas, naoVisitadas, novasLinks, visitadas, empresaBusca, somenteTI]);

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
    if (!session) {
      toast('Você precisa fazer login para ver os detalhes da vaga.');
      router.push('/login');
      return;
    }
    marcarVisitada(vaga.link);
    setSelectedVaga(vaga);
  }

  // ── Renderização ─────────────────────────────────────────────────────────────

  const renderFiltrosSidebar = () => (
    <div className="flex flex-col gap-3">

      {/* Busca */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          ref={searchRef}
          placeholder="Buscar vagas, empresas..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full h-10 pl-9 pr-8 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
        />
        {busca && (
          <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
            <XIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filtros Rápidos */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Localidade</p>
        <div className="flex flex-col gap-1">
          {[
            { id: 'bauru',  label: 'Bauru',       icon: '📍', fn: v => tipoLocalidade(v.local) === 'bauru' },
            { id: 'regiao', label: 'Região',       icon: '🗺️', fn: v => ['bauru','regiao'].includes(tipoLocalidade(v.local)) },
            { id: 'remoto', label: 'Remoto',       icon: '🌐', fn: v => tipoLocalidade(v.local) === 'remoto' },
            { id: 'todas',  label: 'Todas cidades',icon: '✦',  fn: _ => true },
          ].map(f => (
            <button key={f.id} onClick={() => setFiltro(f.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left ${filtro === f.id ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100'}`}>
              <span className="text-base leading-none">{f.icon}</span>
              <span className="flex-1">{f.label}</span>
              <span className={`text-xs font-bold tabular-nums ${filtro === f.id ? 'text-indigo-200' : 'text-slate-400'}`}>{contar(f.fn)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tecnologias */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tecnologia</p>
          {techFiltro && <button onClick={() => setTechFiltro(null)} className="text-[10px] text-red-500 font-bold hover:text-red-700">Limpar</button>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TECHS.map(t => {
            const n = vagasFiltradas.filter(v => t.regex.test(v.titulo)).length;
            if (n === 0 && !loading) return null;
            const on = techFiltro === t.label;
            return (
              <button key={t.label} onClick={() => setTechFiltro(p => p === t.label ? null : t.label)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${on ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : `${t.color} border-transparent hover:scale-105`}`}>
                {t.label}
                {!loading && <span className={`text-[9px] ${on ? 'opacity-70' : 'opacity-50'}`}>{n}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nível */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Nível</p>
        <div className="flex gap-1.5">
          {[{id:'junior',label:'Júnior'},{id:'pleno',label:'Pleno'},{id:'senior',label:'Sênior'}].map(s => (
            <button key={s.id} onClick={() => setSenioridade(p => p === s.id ? 'todas' : s.id)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${senioridade === s.id ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Regime */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Regime</p>
        <div className="flex gap-1.5">
          {[{id:'presencial',label:'Presencial'},{id:'hibrido',label:'Híbrido'},{id:'remoto',label:'Remoto'}].map(m => (
            <button key={m.id} onClick={() => setModoTrabalho(p => p === m.id ? null : m.id)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${modoTrabalho === m.id ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Período */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Período</p>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="h-9 text-xs border-slate-200 rounded-xl bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODOS.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Contrato */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Contrato</p>
        <div className="flex flex-wrap gap-1.5">
          {[{id:'clt',label:'CLT'},{id:'pj',label:'PJ'},{id:'estagio',label:'Estágio'},{id:'trainee',label:'Trainee'}].map(m => (
            <button key={m.id} onClick={() => setModalidade(p => p === m.id ? null : m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${modalidade === m.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preferências */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Preferências</p>
        {[
          { label: '✨ Apenas Novas',   active: somenteNovas,  fn: () => setSomenteNovas(v => !v) },
          { label: '👁 Não Visitadas',   active: naoVisitadas,  fn: () => setNaoVisitadas(v => !v) },
          { label: '❤️ Fixar Favoritas', active: pinarFavoritas, fn: () => setPinarFavoritas(v => !v) },
        ].map(p => (
          <button key={p.label} onClick={p.fn}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all text-left ${p.active ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Limpar filtros */}
      {(filtro !== 'bauru' || senioridade !== 'todas' || modalidade || techFiltro || modoTrabalho || busca || periodo !== '24h') && (
        <button onClick={limparFiltros}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-all">
          <FilterXIcon className="h-3.5 w-3.5" /> Limpar todos os filtros
        </button>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen antialiased transition-colors ${darkMode ? 'dark bg-[#0d0d0d] text-white' : 'bg-[#f4f4f5] text-slate-900'}`}>
      <LoadingBar visible={isAtivo} />

      {/* ── Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex h-14 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
              <BriefcaseIcon className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-sm font-black text-slate-900 dark:text-white">Vagas TI</span>
              <span className="text-[10px] text-indigo-500 font-bold tracking-wide">Bauru & Região</span>
            </div>
          </Link>

          {/* Busca central — desktop */}
          <div className="hidden md:flex flex-1 max-w-sm relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchRef}
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar vagas... (pressione /)"
              className="w-full h-9 pl-9 pr-4 text-sm bg-slate-100 dark:bg-white/10 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white dark:focus:bg-white/20 transition-all"
            />
          </div>

          {/* Ações header */}
          <div className="flex items-center gap-2">
            {/* Botão Somente TI */}
            <button onClick={() => setSomenteTI(v => !v)}
              className={`hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold border transition-all ${somenteTI ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200' : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/20 hover:border-indigo-300'}`}>
              <MonitorIcon className="h-3.5 w-3.5" />
              Somente TI
            </button>

            {novosCount > 0 && !loading && (
              <span className="relative hidden sm:flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full">
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 animate-ping" />
                <BellIcon className="h-3 w-3" /> {novosCount} novas
              </span>
            )}

            <button onClick={() => fetchVagas({ force: true })} disabled={isAtivo}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-500 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 transition-all">
              <RefreshCwIcon className={`h-3.5 w-3.5 ${isAtivo ? 'animate-spin' : ''}`} />
            </button>

            <button onClick={() => setDarkMode(v => !v)}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-500 dark:text-slate-300 hover:border-slate-300 transition-all">
              {darkMode ? <SunIcon className="h-3.5 w-3.5" /> : <MoonIcon className="h-3.5 w-3.5" />}
            </button>

            <div className="hidden md:flex items-center gap-1.5 border-l border-slate-200 dark:border-white/10 pl-2 ml-1">
              <Link href="/candidaturas"
                className="relative h-8 px-2.5 flex items-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                <KanbanIcon className="h-3.5 w-3.5" />
                Kanban
                {kanban.size > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full">{kanban.size}</span>}
              </Link>
              <Link href="/perfil"
                className="h-8 px-2.5 flex items-center gap-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                <AwardIcon className="h-3.5 w-3.5" />
                Perfil
              </Link>
            </div>

            {session?.user && (
              <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-white/10 pl-2 ml-1">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {session.user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <button onClick={() => signOut({ callbackUrl: '/login' })}
                  className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                  <LogOutIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Busca sticky mobile ─────────────────────────── */}
      <div className="md:hidden sticky top-14 z-30 bg-[#f4f4f5]/95 dark:bg-[#0d0d0d]/95 backdrop-blur-md border-b border-black/5 dark:border-white/10 px-4 py-2.5 flex items-center gap-2">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar vagas..."
            className="w-full h-9 pl-9 pr-4 text-sm bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
          />
        </div>
        <Sheet>
          <SheetTrigger className="h-9 w-9 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-300 shrink-0">
            <SlidersHorizontalIcon className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[310px] p-5 overflow-y-auto bg-white dark:bg-[#111] dark:border-white/10">
            <SheetHeader className="mb-5">
              <SheetTitle className="font-black text-base text-left">Filtros</SheetTitle>
            </SheetHeader>
            {renderFiltrosSidebar()}
          </SheetContent>
        </Sheet>
        <button onClick={() => setSomenteTI(v => !v)}
          className={`h-9 px-3 flex items-center gap-1 rounded-xl text-xs font-bold border transition-all shrink-0 ${somenteTI ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-white/10 text-slate-600 border-slate-200 dark:border-white/20'}`}>
          <MonitorIcon className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">TI</span>
        </button>
      </div>

      {/* ── Layout Principal ────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 pb-24 md:pb-8">
        <div className="flex gap-6 items-start">

          {/* Sidebar */}
          <aside className="hidden lg:flex shrink-0 w-64 flex-col gap-4 sticky top-20">
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-black/5 dark:border-white/10 p-4 shadow-sm">
              {renderFiltrosSidebar()}
            </div>
          </aside>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Banner principal */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white p-5 sm:p-6 shadow-lg shadow-indigo-500/20">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0xMiAwaDZ2Nmgtdi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">Catálogo de Vagas TI</h1>
                  <p className="text-indigo-200 text-xs mt-1">
                    {loading ? <>Buscando em todos os portais<LoadingDots /></> : hora ? `Atualizado ${hora} · ${vagas.length} vagas no banco` : 'Pronto'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {novosCount > 0 && !loading && (
                    <span className="flex items-center gap-1 bg-white/15 backdrop-blur-sm border border-white/25 text-[11px] font-bold px-3 py-1.5 rounded-full">
                      <BellIcon className="h-3 w-3" /> {novosCount} novas vagas
                    </span>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(fontes).filter(([,n]) => n > 0).slice(0, 5).map(([fonte]) => (
                      <img key={fonte} src={`https://www.google.com/s2/favicons?domain=${FONTE_CONFIG[fonte] ? (() => { const m = {linkedin:'linkedin.com',vagasbauru:'vagasbauru.com.br',indeed:'indeed.com',vagascom:'vagas.com.br',ciee:'ciee.org.br',catho:'catho.com.br',empregoscom:'empregos.com.br',querovagastech:'querovagastech.com.br'}; return m[fonte]||''; })() : ''}&sz=32`}
                        alt={fonte} width={18} height={18} className="rounded-md bg-white/20 p-0.5"
                        onError={e => { e.currentTarget.style.display='none'; }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de controles */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white text-base tabular-nums">{vagasOrdenadas.length}</strong>
                  {' '}vaga{vagasOrdenadas.length !== 1 ? 's' : ''}
                </span>
                {/* Tags de filtros ativos */}
                {techFiltro && (
                  <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full px-2.5 py-1 font-semibold">
                    {techFiltro} <button onClick={() => setTechFiltro(null)} className="hover:text-red-500 ml-0.5"><XIcon className="h-3 w-3" /></button>
                  </span>
                )}
                {busca && (
                  <span className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-full px-2.5 py-1 font-semibold">
                    "{busca}" <button onClick={() => setBusca('')} className="hover:text-red-500 ml-0.5"><XIcon className="h-3 w-3" /></button>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Visualização */}
                <div className="flex rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-0.5">
                  {[
                    { id: 'grade',    icon: <LayoutGridIcon className="h-3.5 w-3.5" />, active: vista === 'grade' && tamanho === 'normal',    fn: () => { setVista('grade'); setTamanho('normal'); } },
                    { id: 'compacto', icon: <SparklesIcon className="h-3.5 w-3.5" />,  active: vista === 'grade' && tamanho === 'compacto', fn: () => { setVista('grade'); setTamanho('compacto'); } },
                    { id: 'lista',    icon: <ListIcon className="h-3.5 w-3.5" />,       active: vista === 'lista',                             fn: () => setVista('lista') },
                  ].map(v => (
                    <button key={v.id} onClick={v.fn}
                      className={`p-1.5 rounded-lg transition-all ${v.active ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}>
                      {v.icon}
                    </button>
                  ))}
                </div>
                {/* Ordenação */}
                <Select value={ordem} onValueChange={setOrdem}>
                  <SelectTrigger className="h-8 text-xs w-[130px] border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data" className="text-xs">Mais recente</SelectItem>
                    <SelectItem value="empresa" className="text-xs">Empresa A–Z</SelectItem>
                    <SelectItem value="titulo" className="text-xs">Título A–Z</SelectItem>
                  </SelectContent>
                </Select>
                {/* Exportar */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={exportarCSV}
                      className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:border-slate-300 transition-all">
                      <DownloadIcon className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Exportar CSV</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Notificações/Onboarding */}
            {onboarding && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-2xl">
                <SparklesIcon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-0.5">Bem-vindo ao Vagas TI Bauru! 👋</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">Pressione <kbd className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-[10px] font-mono border border-blue-200 dark:border-blue-800">/</kbd> para buscar. Use <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-[10px]">-palavra</code> para excluir termos.</p>
                </div>
                <button onClick={() => { setOnboarding(false); localStorage.setItem('onboarding_done', '1'); }}
                  className="text-blue-400 hover:text-blue-700 shrink-0"><XIcon className="h-4 w-4" /></button>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl text-sm text-red-700 dark:text-red-400">
                <span>Erro ao carregar: {error}</span>
                <button onClick={() => fetchVagas()} className="text-xs font-bold underline hover:no-underline">Tentar novamente</button>
              </div>
            )}

            {/* Vagas ocultadas */}
            {ocultas.size > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <EyeOffIcon className="h-3.5 w-3.5" />
                <span>{ocultas.size} vaga{ocultas.size > 1 ? 's ocultadas' : ' ocultada'}</span>
                <button onClick={() => { setOcultas(new Set()); localStorage.removeItem(LS_OCULTAS); toast.success('Vagas restauradas'); }}
                  className="text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">
                  mostrar todas
                </button>
              </div>
            )}

            {/* Grid de vagas */}
            {(() => {
              const gridClass = vista === 'lista'
                ? 'flex flex-col gap-2'
                : tamanho === 'compacto'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'
                : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4';

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
                  onTechClick={tech => setTechFiltro(p => p === tech ? null : tech)}
                  busca={busca}
                  vista={vista}
                  tamanho={tamanho}
                  index={i}
                />
              );

              const emptyState = (
                <div className="col-span-full py-24 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 mb-4 shadow-sm">
                    <BriefcaseIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="font-bold text-slate-800 dark:text-white text-lg">Nenhuma vaga encontrada</p>
                  <p className="text-sm text-slate-400 mt-1">Tente outros filtros ou amplie o período</p>
                  <button onClick={limparFiltros} className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all">
                    Limpar filtros
                  </button>
                </div>
              );

              if (loading) return (
                <div>
                  <CenteredLoader />
                  <div key={gridKey} className={gridClass}>
                    {Array.from({ length: 6 }).map((_, i) => <VagaCardSkeleton key={i} index={i} vista={vista} />)}
                  </div>
                </div>
              );

              if (agrupar !== 'nenhum' && gruposVagas) {
                if (vagasOrdenadas.length === 0) return <div className={gridClass}>{emptyState}</div>;
                return (
                  <div className="flex flex-col gap-8">
                    {gruposVagas.map(({ key, label, items }) => (
                      <div key={key}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <LayersIcon className="h-3.5 w-3.5" />{label} <span className="font-normal opacity-60">({items.length})</span>
                          </span>
                          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                        </div>
                        <div key={`${gridKey}-${key}`} className={gridClass}>{items.map(renderCard)}</div>
                      </div>
                    ))}
                  </div>
                );
              }

              if (vagasOrdenadas.length === 0 && !error) return <div className={gridClass}>{emptyState}</div>;

              return (
                <div key={`${gridKey}-${filterKey}`} className={`${gridClass} fade-slide-up`}>
                  {vagasOrdenadas.map(renderCard)}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-black/5 dark:border-white/10 py-8 text-center text-xs text-slate-400 dark:text-slate-600">
        Vagas de TI em Bauru · Atualização automática a cada 10 min ·{' '}
        <a href="https://www.linkedin.com/in/daniel-op/" target="_blank" rel="noopener noreferrer"
          className="hover:text-indigo-500 transition-colors font-medium">
          Daniel Ortega Pereira
        </a>
      </footer>

      {/* ── Navegação Inferior Mobile ───────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#111]/90 backdrop-blur-xl border-t border-black/5 dark:border-white/10 flex items-center justify-around h-16 px-2 safe-area-bottom">
        <Link href="/" className="flex flex-col items-center justify-center gap-1 w-16 h-full text-indigo-600 dark:text-indigo-400">
          <BriefcaseIcon className="h-5 w-5" />
          <span className="text-[9px] font-bold">Vagas</span>
        </Link>
        <Link href="/candidaturas" className="relative flex flex-col items-center justify-center gap-1 w-16 h-full text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors">
          <KanbanIcon className="h-5 w-5" />
          <span className="text-[9px] font-medium">Kanban</span>
          {kanban.size > 0 && <span className="absolute top-2.5 right-3 w-3.5 h-3.5 bg-indigo-600 text-[7px] text-white font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#111]">{kanban.size}</span>}
        </Link>
        <Link href="/perfil" className="flex flex-col items-center justify-center gap-1 w-16 h-full text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors">
          <AwardIcon className="h-5 w-5" />
          <span className="text-[9px] font-medium">Perfil</span>
        </Link>
      </nav>

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
