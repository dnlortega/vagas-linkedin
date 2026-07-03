// Sistema de Vagas de TI em Bauru
// Criado por Daniel Ortega Pereira
// https://github.com/dnlortega/vagas-linkedin

'use client';

import { useEffect, useState } from 'react';
import { ExternalLinkIcon, MapPinIcon, CalendarIcon, UsersIcon, HeartIcon, KanbanIcon, XIcon, Share2Icon, CopyIcon, StarIcon, ClockIcon, Building2Icon, ChevronLeftIcon, ChevronRightIcon, MailIcon, NavigationIcon, PrinterIcon, SearchIcon, CheckCircleIcon, SparklesIcon, AlertTriangleIcon, FileTextIcon, BarChart2Icon, GlobeIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

const LS_FAV    = 'vagas_favoritas';
const LS_KANBAN = 'vagas_kanban';
const LS_NOTAS  = 'vagas_notas';
const LS_STARS  = 'vagas_estrelas';

const FONTE_CONFIG = {
  linkedin:   { label: 'LinkedIn',   color: 'bg-blue-100 text-blue-700 border-blue-200',    accent: '#3b82f6' },
  vagasbauru: { label: 'VagasBauru', color: 'bg-rose-100 text-rose-700 border-rose-200',    accent: '#f43f5e' },
  indeed:     { label: 'Indeed',     color: 'bg-sky-100 text-sky-700 border-sky-200',        accent: '#0ea5e9' },
  vagascom:   { label: 'Vagas.com',  color: 'bg-amber-100 text-amber-700 border-amber-200', accent: '#f59e0b' },
  ciee:       { label: 'CIEE',       color: 'bg-teal-100 text-teal-700 border-teal-200',    accent: '#14b8a6' },
};

// Detecção de tecnologias no título (espelho do page.js)
const TECHS_MODAL = [
  { label: 'React',       regex: /\breact\b/i,                          color: 'bg-cyan-100 text-cyan-700 border-cyan-200'       },
  { label: 'Vue',         regex: /\bvue\.?js\b/i,                       color: 'bg-green-100 text-green-700 border-green-200'    },
  { label: 'Angular',     regex: /\bangular\b/i,                        color: 'bg-red-100 text-red-700 border-red-200'          },
  { label: 'Node.js',     regex: /\bnode\.?js\b/i,                      color: 'bg-green-100 text-green-600 border-green-200'    },
  { label: 'Python',      regex: /\bpython\b/i,                         color: 'bg-blue-100 text-blue-700 border-blue-200'       },
  { label: 'Java',        regex: /\bjava\b(?!script)/i,                 color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { label: 'JavaScript',  regex: /\bjavascript\b|\bjs\b/i,              color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { label: 'TypeScript',  regex: /\btypescript\b|\bts\b/i,              color: 'bg-blue-100 text-blue-600 border-blue-200'       },
  { label: 'PHP',         regex: /\bphp\b/i,                            color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { label: '.NET/C#',     regex: /\bc#\b|\.net\b/i,                     color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { label: 'SQL',         regex: /\bsql\b|\bmysql\b|\bpostgres\b/i,     color: 'bg-slate-100 text-slate-700 border-slate-200'    },
  { label: 'Power BI',    regex: /power\s*bi|\bpowerbi\b/i,             color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { label: 'AWS',         regex: /\baws\b|\bamazon web\b/i,             color: 'bg-amber-100 text-amber-700 border-amber-200'    },
  { label: 'Docker',      regex: /\bdocker\b|\bkubernetes\b|\bk8s\b/i,  color: 'bg-sky-100 text-sky-700 border-sky-200'         },
  { label: 'DevOps',      regex: /\bdevops\b/i,                         color: 'bg-rose-100 text-rose-700 border-rose-200'       },
  { label: 'Flutter',     regex: /\bflutter\b|\bdart\b/i,               color: 'bg-cyan-100 text-cyan-600 border-cyan-200'       },
  { label: 'Kotlin',      regex: /\bkotlin\b|\bandroid\b/i,             color: 'bg-violet-100 text-violet-700 border-violet-200' },
];
function detectarTechsModal(titulo) { return TECHS_MODAL.filter(t => t.regex.test(titulo)); }

const ICONES_CRITERIO = {
  'Nível de experiência': '📊', 'Seniority level': '📊',
  'Tipo de emprego': '💼',      'Employment type': '💼',
  'Função': '🏷️',               'Job function': '🏷️',
  'Indústrias': '🏭',           'Industries': '🏭',
  'Setores': '🏭',
};

function formatData(data) {
  if (!data) return null;
  const diff = Math.floor((Date.now() - new Date(data)) / 86400000);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff < 7)  return `há ${diff} dias`;
  if (diff < 30) return `há ${Math.floor(diff / 7)} semana(s)`;
  if (diff < 365) return `há ${Math.floor(diff / 30)} mês(es)`;
  return `há ${Math.floor(diff / 365)} ano(s)`;
}

function iniciais(empresa) {
  if (!empresa || empresa === 'N/A') return '?';
  return empresa.split(/\s+/).filter(w => w.length > 2).slice(0, 2).map(w => w[0].toUpperCase()).join('')
      || empresa[0].toUpperCase();
}

function TimeOpenBar({ data }) {
  if (!data) return null;
  const dias = Math.floor((Date.now() - new Date(data)) / 86400000);
  const pct  = Math.min(100, (dias / 30) * 100);
  const cor  = dias <= 3 ? 'bg-green-500' : dias <= 7 ? 'bg-yellow-500' : dias <= 14 ? 'bg-orange-500' : 'bg-red-400';
  const msg  = dias <= 3 ? 'Muito recente' : dias <= 7 ? 'Esta semana' : dias <= 14 ? 'Pode ainda estar aberta' : 'Pode estar encerrada';
  return (
    <div className="px-6 py-3 bg-white">
      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
        <span>Publicada há {dias === 0 ? 'hoje' : `${dias} dia${dias !== 1 ? 's' : ''}`}</span>
        <span className={dias > 14 ? 'text-red-400 font-semibold' : 'text-green-600 font-semibold'}>{msg}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <StarIcon
            className={`h-5 w-5 transition-colors ${n <= (hover || value) ? 'text-amber-400' : 'text-gray-200'}`}
            fill={n <= (hover || value) ? 'currentColor' : 'none'}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-[11px] text-gray-400 ml-1">
          {['', 'Baixa', 'Regular', 'Boa', 'Muito boa', 'Excelente'][value]}
        </span>
      )}
    </div>
  );
}

export default function VagaModal({ vaga, vagas = [], onClose, onOpen, onPrev, onNext }) {
  const [detalhe,  setDetalhe]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [erro,     setErro]     = useState(null);
  const [open,     setOpen]     = useState(true);
  const [isFav,    setIsFav]    = useState(false);
  const [noKanban, setNoKanban] = useState(false);
  const [notas,    setNotas]    = useState('');
  const [estrelas, setEstrelas] = useState(0);
  const [copiado,    setCopiado]    = useState(false);
  const [notaSalva,  setNotaSalva]  = useState(false);
  const [aiAcao,     setAiAcao]     = useState(null);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiResultado, setAiResultado] = useState({});
  const [aiAberto,   setAiAberto]   = useState(false);

  const jobId    = vaga?.link?.match(/(\d{9,})/)?.[1];
  const dataRel  = formatData(vaga?.data);
  const fonteCfg = FONTE_CONFIG[vaga?.fonte] || { label: vaga?.fonte || '', color: 'bg-gray-100 text-gray-600 border-gray-200', accent: '#94a3b8' };

  // Vagas similares (mesmo termo ou mesma fonte, exclui a atual)
  const similares = vagas
    .filter(v => v.link !== vaga?.link && (v.termo === vaga?.termo || v.fonte === vaga?.fonte))
    .slice(0, 3);

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem(LS_FAV) || '[]');
      setIsFav(favs.includes(vaga?.link));
      const kb = JSON.parse(localStorage.getItem(LS_KANBAN) || '{}');
      setNoKanban(!!kb[vaga?.link]);
      const n = JSON.parse(localStorage.getItem(LS_NOTAS) || '{}');
      setNotas(n[vaga?.link] || '');
      const s = JSON.parse(localStorage.getItem(LS_STARS) || '{}');
      setEstrelas(s[vaga?.link] || 0);
    } catch (_) {}
  }, [vaga?.link]);

  function toggleFav() {
    try {
      const favs = new Set(JSON.parse(localStorage.getItem(LS_FAV) || '[]'));
      if (favs.has(vaga.link)) favs.delete(vaga.link); else favs.add(vaga.link);
      localStorage.setItem(LS_FAV, JSON.stringify([...favs]));
      setIsFav(favs.has(vaga.link));
    } catch (_) {}
  }

  function adicionarKanban() {
    try {
      const kb = JSON.parse(localStorage.getItem(LS_KANBAN) || '{}');
      if (!kb[vaga.link]) {
        kb[vaga.link] = {
          link: vaga.link, titulo: vaga.titulo, empresa: vaga.empresa,
          local: vaga.local, data: vaga.data, status: 'salvo', fonte: vaga.fonte,
          adicionadoEm: new Date().toISOString(),
        };
        localStorage.setItem(LS_KANBAN, JSON.stringify(kb));
        setNoKanban(true);
      }
    } catch (_) {}
  }

  function salvarNotas(texto) {
    setNotas(texto);
    try {
      const n = JSON.parse(localStorage.getItem(LS_NOTAS) || '{}');
      if (texto.trim()) n[vaga.link] = texto;
      else delete n[vaga.link];
      localStorage.setItem(LS_NOTAS, JSON.stringify(n));
      setNotaSalva(true);
      setTimeout(() => setNotaSalva(false), 1500);
    } catch (_) {}
  }

  function salvarEstrelas(val) {
    setEstrelas(val);
    try {
      const s = JSON.parse(localStorage.getItem(LS_STARS) || '{}');
      if (val > 0) s[vaga.link] = val;
      else delete s[vaga.link];
      localStorage.setItem(LS_STARS, JSON.stringify(s));
    } catch (_) {}
  }

  function copiarLink() {
    navigator.clipboard.writeText(vaga.link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  function compartilharWhatsApp() {
    const texto = `${vaga.titulo} — ${vaga.empresa !== 'N/A' ? vaga.empresa : ''}\n${vaga.link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  }

  function compartilharTelegram() {
    const texto = `${vaga.titulo} — ${vaga.empresa !== 'N/A' ? vaga.empresa : ''}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(vaga.link)}&text=${encodeURIComponent(texto)}`, '_blank');
  }

  function compartilharEmail() {
    const assunto = `Vaga: ${vaga.titulo}`;
    const corpo   = `Olha essa vaga:\n\n${vaga.titulo}\n${vaga.empresa !== 'N/A' ? vaga.empresa + '\n' : ''}${vaga.local}\n\n${vaga.link}`;
    window.open(`mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`);
  }

  function abrirMaps() {
    if (!vaga.local || vaga.local === 'N/A') return;
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(vaga.local)}`, '_blank');
  }

  async function chamarGemini(acao) {
    if (aiLoading) return;
    if (aiResultado[acao]) {
      setAiAcao(acao);
      setAiAberto(true);
      return;
    }
    const textoDesc = detalhe?.descricao
      ? detalhe.descricao.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      : '';
    setAiAcao(acao);
    setAiLoading(true);
    setAiAberto(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, descricao: textoDesc, titulo: vaga?.titulo, empresa: vaga?.empresa }),
      });
      const data = await res.json();
      if (data.erro) throw new Error(data.erro);
      setAiResultado(prev => ({ ...prev, [acao]: data.resultado }));
    } catch (e) {
      setAiResultado(prev => ({ ...prev, [acao]: `Erro: ${e.message}` }));
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    if (!jobId || vaga?.fonte !== 'linkedin') { setLoading(false); return; }
    try {
      const cached = JSON.parse(localStorage.getItem(`vd_${jobId}`) || 'null');
      if (cached) { setDetalhe(cached); setLoading(false); return; }
    } catch (_) {}
    fetch(`/api/vaga/${jobId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setDetalhe(d);
        try { localStorage.setItem(`vd_${jobId}`, JSON.stringify(d)); } catch (_) {}
      })
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  }, [jobId, vaga?.fonte]);

  function handleOpenChange(v) {
    setOpen(v);
    if (!v) setTimeout(onClose, 200);
  }

  const dataExibida = dataRel || detalhe?.publicado || null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-lg p-0 flex flex-col gap-0 overflow-hidden border-l border-gray-100">

        {/* Barra colorida topo */}
        <div className="h-1.5 w-full flex-shrink-0" style={{ backgroundColor: fonteCfg.accent }} />

        {/* Navegação ← → */}
        {(onPrev || onNext) && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
            <button onClick={onPrev} disabled={!onPrev}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium">
              <ChevronLeftIcon className="h-4 w-4" /> Anterior
            </button>
            <span className="text-[10px] text-gray-400">← → para navegar</span>
            <button onClick={onNext} disabled={!onNext}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium">
              Próxima <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Cabeçalho */}
        <div className="relative px-6 pt-5 pb-4 bg-white flex-shrink-0">
          <button
            onClick={() => handleOpenChange(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <XIcon className="h-4 w-4" />
          </button>

          {/* Avatar + empresa + título */}
          <div className="flex gap-4 items-start pr-8">
            <div className="h-14 w-14 rounded-xl shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-md"
              style={{ backgroundColor: fonteCfg.accent }}>
              {iniciais(vaga.empresa)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-500 truncate">
                  {vaga.empresa === 'N/A' ? '—' : vaga.empresa}
                </p>
                {vaga.empresa && vaga.empresa !== 'N/A' && (
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(vaga.empresa)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0"
                      title="Ver empresa no LinkedIn"
                    >
                      <Building2Icon className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={`https://www.glassdoor.com.br/Avalia%C3%A7%C3%B5es/${encodeURIComponent(vaga.empresa.replace(/\s+/g, '-'))}-Avalia%C3%A7%C3%B5es-E0.htm`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-600 transition-colors flex-shrink-0"
                      title="Ver avaliações no Glassdoor"
                    >
                      <StarIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
              <h2 className="text-base font-bold text-gray-900 leading-snug">{vaga.titulo}</h2>
            </div>
          </div>

          {/* Metadados */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-xs text-gray-500">
            {vaga.local && vaga.local !== 'N/A' && (
              <button onClick={abrirMaps} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors group">
                <MapPinIcon className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500" />
                {vaga.local}
                <NavigationIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
              </button>
            )}
            {dataExibida && (
              <span className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5 text-gray-400" />{dataExibida}</span>
            )}
            {detalhe?.candidatos && (
              <span className="flex items-center gap-1.5"><UsersIcon className="h-3.5 w-3.5 text-gray-400" />{detalhe.candidatos}</span>
            )}
          </div>

          {/* Badges + estrelas */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${fonteCfg.color}`}>
              {fonteCfg.label}
            </span>
            {vaga.termo && vaga.termo !== 'vagasbauru' && vaga.termo !== 'ciee' && (
              <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-500">
                {vaga.termo}
              </span>
            )}
            <div className="ml-auto">
              <StarRating value={estrelas} onChange={salvarEstrelas} />
            </div>
          </div>

          {/* Techs detectadas no título */}
          {detectarTechsModal(vaga.titulo).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {detectarTechsModal(vaga.titulo).map(t => (
                <span key={t.label} className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${t.color}`}>{t.label}</span>
              ))}
            </div>
          )}
        </div>

        {/* Barra de tempo */}
        {vaga.data && (
          <>
            <div className="h-px bg-gray-100 flex-shrink-0" />
            <TimeOpenBar data={vaga.data} />
          </>
        )}

        <div className="h-px bg-gray-100 flex-shrink-0" />

        {/* Critérios */}
        {detalhe?.criterios && Object.keys(detalhe.criterios).length > 0 && (
          <>
            <div className="px-6 py-3 flex flex-wrap gap-2 bg-white flex-shrink-0">
              {Object.entries(detalhe.criterios).map(([label, value]) => (
                <div key={label} className="inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
                  <span>{ICONES_CRITERIO[label] || '📌'}</span>
                  <span className="text-gray-400">{label}:</span>
                  <span className="font-semibold text-gray-700">{value}</span>
                </div>
              ))}
            </div>
            <div className="h-px bg-gray-100 flex-shrink-0" />
          </>
        )}

        {/* Competências */}
        {detalhe?.competencias?.length > 0 && (
          <>
            <div className="px-6 py-3 bg-white flex flex-wrap gap-1.5 items-center flex-shrink-0">
              <span className="text-xs text-gray-400 mr-1">Competências:</span>
              {detalhe.competencias.map(c => (
                <span key={c} className="text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">{c}</span>
              ))}
            </div>
            <div className="h-px bg-gray-100 flex-shrink-0" />
          </>
        )}

        {/* Descrição */}
        <ScrollArea className="flex-1 min-h-0 bg-white">
          <div className="px-6 py-5">

            {/* ── Painel IA Gemini (sempre visível no topo) ── */}
            <div className="mb-5 pb-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <SparklesIcon className="h-3.5 w-3.5 text-violet-500" />
                  <p className="text-xs font-semibold text-gray-600">Análise com IA</p>
                </div>
                {aiAberto && (
                  <button onClick={() => setAiAberto(false)} className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5">
                    <ChevronUpIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { acao: 'resumir',         icon: FileTextIcon,      label: 'Resumir',   color: 'blue'   },
                  { acao: 'redflags',        icon: AlertTriangleIcon, label: 'Red flags', color: 'rose'   },
                  { acao: 'carta',           icon: MailIcon,          label: 'Carta',     color: 'green'  },
                  { acao: 'compatibilidade', icon: BarChart2Icon,     label: 'Fit',       color: 'amber'  },
                  { acao: 'traduzir',        icon: GlobeIcon,         label: 'Traduzir',  color: 'violet' },
                ].map(({ acao, icon: Icon, label, color }) => {
                  const isActive = aiAcao === acao && aiAberto;
                  const isDone   = !!aiResultado[acao];
                  const colorMap = {
                    blue:   { base: 'border-blue-200 text-blue-600 hover:bg-blue-50',    active: 'bg-blue-600 text-white border-blue-600'    },
                    rose:   { base: 'border-rose-200 text-rose-600 hover:bg-rose-50',    active: 'bg-rose-600 text-white border-rose-600'    },
                    green:  { base: 'border-green-200 text-green-700 hover:bg-green-50', active: 'bg-green-600 text-white border-green-600'  },
                    amber:  { base: 'border-amber-200 text-amber-700 hover:bg-amber-50', active: 'bg-amber-500 text-white border-amber-500'  },
                    violet: { base: 'border-violet-200 text-violet-600 hover:bg-violet-50', active: 'bg-violet-600 text-white border-violet-600' },
                  };
                  const cls = isActive ? colorMap[color].active : colorMap[color].base;
                  return (
                    <button
                      key={acao}
                      onClick={() => chamarGemini(acao)}
                      disabled={aiLoading && aiAcao === acao}
                      title={label}
                      className={`relative flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border bg-white text-[10px] font-semibold transition-all ${cls}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="leading-none">{label}</span>
                      {isDone && !isActive && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {aiAberto && (
                <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4 min-h-[56px]">
                  {aiLoading ? (
                    <div className="flex items-center gap-2 text-xs text-violet-400">
                      <SparklesIcon className="h-3.5 w-3.5 animate-pulse" />
                      <span>Gemini está pensando…</span>
                    </div>
                  ) : aiResultado[aiAcao] ? (
                    <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {aiResultado[aiAcao]}
                    </div>
                  ) : (
                    <p className="text-xs text-violet-400">Clique em um botão acima para analisar esta vaga.</p>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className={`h-3.5 ${['w-full','w-5/6','w-full','w-3/4','w-full','w-full','w-2/3','w-full','w-5/6','w-full'][i]}`} />
                ))}
              </div>
            ) : erro ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="font-bold text-gray-700">Não foi possível carregar</p>
                <p className="text-xs text-gray-400 mt-1">{erro}</p>
              </div>
            ) : detalhe?.descricao ? (
              <div className="job-description" dangerouslySetInnerHTML={{ __html: detalhe.descricao }} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: fonteCfg.accent + '20' }}>
                  <ExternalLinkIcon className="h-6 w-6" style={{ color: fonteCfg.accent }} />
                </div>
                <p className="font-bold text-gray-700">Descrição no {fonteCfg.label}</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[220px]">Clique em "Ver vaga" para ver a descrição completa.</p>
              </div>
            )}

            {/* Notas pessoais */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500">📝 Minhas notas</p>
                {notaSalva && (
                  <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1 animate-in fade-in-0 duration-200">
                    <CheckCircleIcon className="h-3 w-3" /> Salvo
                  </span>
                )}
              </div>
              <textarea
                value={notas}
                onChange={e => salvarNotas(e.target.value)}
                placeholder="Anotações pessoais sobre essa vaga…"
                rows={3}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3.5 py-3 resize-none focus:outline-none focus:border-blue-400 transition-colors placeholder-gray-300"
              />
              <p className="text-[10px] text-gray-300 text-right mt-1">{notas.length} caracteres</p>
            </div>

            {/* Vagas similares */}
            {similares.length > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-3">🔗 Vagas similares</p>
                <div className="flex flex-col gap-2">
                  {similares.map(v => {
                    const cfg = FONTE_CONFIG[v.fonte] || { label: v.fonte, accent: '#94a3b8' };
                    return (
                      <button
                        key={v.link}
                        onClick={() => onOpen?.(v)}
                        className="flex items-center gap-3 text-left p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                      >
                        <div className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: cfg.accent }}>
                          {iniciais(v.empresa)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate group-hover:text-blue-700">{v.titulo}</p>
                          <p className="text-[11px] text-gray-400 truncate">{v.empresa !== 'N/A' ? v.empresa : ''}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${cfg.color || 'bg-gray-100 text-gray-500 border-gray-200'}`}>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Rodapé */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/80 px-5 py-4 flex flex-col gap-2">
          <Button asChild className="w-full gap-2 h-11 font-semibold text-sm rounded-xl">
            <a href={vaga.link} target="_blank" rel="noopener noreferrer">
              Ver vaga no {fonteCfg.label}
              <ExternalLinkIcon className="h-4 w-4" />
            </a>
          </Button>

          <div className="flex gap-2">
            <button
              onClick={toggleFav}
              className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border text-xs font-semibold transition-all ${
                isFav ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' : 'bg-white border-gray-200 text-gray-500 hover:border-rose-200 hover:text-rose-500'
              }`}
            >
              <HeartIcon className={`h-3.5 w-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
              {isFav ? 'Favoritado' : 'Favoritar'}
            </button>

            <button
              onClick={adicionarKanban}
              disabled={noKanban}
              className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border text-xs font-semibold transition-all ${
                noKanban ? 'bg-indigo-50 border-indigo-200 text-indigo-500 cursor-default' : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600'
              }`}
            >
              <KanbanIcon className="h-3.5 w-3.5" />
              {noKanban ? 'No quadro ✓' : 'Ao quadro'}
            </button>
          </div>

          <div className="flex gap-1.5 justify-center flex-wrap">
            <button onClick={compartilharWhatsApp} title="WhatsApp"
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-green-300 hover:text-green-600 transition-all">
              <Share2Icon className="h-4 w-4" />
            </button>

            <button onClick={compartilharTelegram} title="Telegram"
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-sky-300 hover:text-sky-600 transition-all">
              <span className="text-sm font-bold leading-none">✈</span>
            </button>

            <button onClick={compartilharEmail} title="E-mail"
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-all">
              <MailIcon className="h-4 w-4" />
            </button>

            <button onClick={copiarLink} title="Copiar link"
              className={`flex items-center justify-center h-9 w-9 rounded-xl border transition-all ${copiado ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}>
              <CopyIcon className="h-4 w-4" />
            </button>

            <button
              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(vaga.titulo + ' ' + (vaga.empresa !== 'N/A' ? vaga.empresa : ''))}`, '_blank')}
              title="Buscar no Google"
              className="flex items-center justify-center h-9 w-9 rounded-xl border bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-all">
              <SearchIcon className="h-4 w-4" />
            </button>

            <button
              onClick={() => window.print()}
              title="Imprimir"
              className="flex items-center justify-center h-9 w-9 rounded-xl border bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-all">
              <PrinterIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}
